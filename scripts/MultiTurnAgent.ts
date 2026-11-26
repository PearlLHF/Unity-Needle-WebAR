/*
 * MultiTurnAgent.ts
 * W3 第三部分第 2 步（多轮对话）的 Needle 组件（路线 A：全 Overlay 输入与历史 + 3D 空间气泡翻页）。
 *
 * 【功能】
 * 在第 1 步 AskAgent.ts 的基础上升级为多轮对话：
 * 1. 右上角密码形式 API Key 框与底部紧凑输入栏挂载在 Needle arOverlayElement 中。
 * 2. 左上角在 arOverlayElement 中生成可折叠、原生滚动的对话历史面板（含清空按钮）。
 * 3. 物体上方：在 World Canvas 气泡（worldBubblePanel / worldBubbleText）显示最新回复，支持翻页。
 * 4. 多轮记忆：把历史消息一起发给 CloseAI（默认保留最近 6 轮，可在 Inspector 调整 Max History Turns），支持连续追问。
 *
 * 【放在哪里】
 * 复制到 Needle Web 项目的 src/scripts/ai/MultiTurnAgent.ts。
 * 保存后回到 Unity，等待 Unity 生成同名的 MultiTurnAgent 组件。
 *
 * 【怎么挂载】
 * 1. 沿用第 1 步的 AgentWorldBubble.prefab（无需额外建 HistoryCanvas）。
 * 2. 选中 Cube，取消勾选或移除旧的 AskAgent，Add Component 搜索 MultiTurnAgent 并添加。
 * 3. 拖入 BubblePanel、BubbleText、CloseBubbleButton、PrevPageButton、NextPageButton，保存场景。
 */

import {
  Behaviour,
  Button,
  GameObject,
  serializable,
  Text,
} from "@needle-tools/engine";
import { Object3D } from "three";

const BASE_URL = "https://api.openai-proxy.org/v1";
const MAX_INPUT_CHARS = 1000;
const BUBBLE_LINE_UNITS = 11.5;
const BUBBLE_MAX_LINES = 3;
const API_KEY_CONTAINER_ID = "closeai-api-key-box";
const API_KEY_INPUT_ID = "closeai-api-key-input";
const CHAT_BAR_ID = "agent-chat-input-bar";
const HISTORY_BOX_ID = "agent-chat-history-box";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function paginateText(text: string): string[] {
  const clean = text.trim();
  if (!clean) return [""];

  const lines: string[] = [];
  for (const rawLine of clean.split("\n")) {
    if (rawLine.length === 0) {
      lines.push("");
      continue;
    }
    let cur = "";
    let units = 0;
    for (const ch of rawLine) {
      const w = ch.charCodeAt(0) > 127 ? 1 : 0.55;
      if (units + w > BUBBLE_LINE_UNITS && cur.length > 0) {
        lines.push(cur);
        cur = ch;
        units = w;
      } else {
        cur += ch;
        units += w;
      }
    }
    if (cur.length > 0) lines.push(cur);
  }

  const pages: string[] = [];
  for (let i = 0; i < lines.length; i += BUBBLE_MAX_LINES) {
    pages.push(lines.slice(i, i + BUBBLE_MAX_LINES).join("\n").trimEnd());
  }
  return pages.length > 0 ? pages : [""];
}

function describeError(status: number): string {
  if (status === 401) return "Key 无效（401），请检查右上角的 CloseAI Key。";
  if (status === 429) return "请求被限制（429），可能是余额不足或请求太频繁。";
  if (status === 0) return "网络错误，没有连上 api.openai-proxy.org。";
  return `请求失败（${status}），详细原因见浏览器 Console。`;
}

function ensureApiKeyInput(host: HTMLElement): HTMLInputElement {
  const existing = document.getElementById(API_KEY_INPUT_ID) as HTMLInputElement | null;
  if (existing) {
    const existingBox = document.getElementById(API_KEY_CONTAINER_ID);
    if (existingBox && existingBox.parentElement !== host) {
      host.appendChild(existingBox);
    }
    return existing;
  }

  const box = document.createElement("div");
  box.id = API_KEY_CONTAINER_ID;
  box.style.cssText = [
    "position: fixed",
    "top: calc(max(44px, env(safe-area-inset-top, 0px)) + 12px)",
    "right: 12px",
    "height: 36px",
    "box-sizing: border-box",
    "display: flex",
    "align-items: center",
    "gap: 6px",
    "padding: 0 10px",
    "border: 1px solid rgba(255, 255, 255, 0.16)",
    "border-radius: 10px",
    "background: rgba(15, 23, 42, 0.85)",
    "box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2)",
    "backdrop-filter: blur(8px)",
    "color: #ffffff",
    "font-family: system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    "font-size: 13px",
    "z-index: 9999",
    "pointer-events: auto",
  ].join(";");

  box.addEventListener("pointerdown", (e) => e.stopPropagation());
  box.addEventListener("click", (e) => e.stopPropagation());

  const label = document.createElement("label");
  label.htmlFor = API_KEY_INPUT_ID;
  label.textContent = "API Key";
  label.style.cssText = "white-space: nowrap; font-weight: 500; color: rgba(255, 255, 255, 0.88);";

  const input = document.createElement("input");
  input.id = API_KEY_INPUT_ID;
  input.type = "password";
  input.placeholder = "输入 CloseAI Key (sk-...)";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.style.cssText = [
    "width: min(160px, 34vw)",
    "height: 24px",
    "box-sizing: border-box",
    "padding: 0 8px",
    "border: 1px solid rgba(255, 255, 255, 0.24)",
    "border-radius: 6px",
    "background: rgba(255, 255, 255, 0.12)",
    "color: #ffffff",
    "font-size: 13px",
    "outline: none",
  ].join(";");

  box.append(label, input);
  host.appendChild(box);
  return input;
}

function createChatBar(
  host: HTMLElement,
  onSubmit: (text: string) => void
): { bar: HTMLDivElement; input: HTMLInputElement } {
  document.getElementById(CHAT_BAR_ID)?.remove();

  const bar = document.createElement("div");
  bar.id = CHAT_BAR_ID;
  bar.style.cssText = [
    "position: fixed",
    "left: 50%",
    "bottom: calc(env(safe-area-inset-bottom, 0px) + 88px)",
    "transform: translateX(-50%)",
    "width: min(520px, calc(100vw - 24px))",
    "box-sizing: border-box",
    "display: flex",
    "align-items: center",
    "gap: 8px",
    "padding: 8px 10px",
    "border-radius: 12px",
    "background: rgba(15, 23, 42, 0.88)",
    "z-index: 9999",
    "pointer-events: auto",
  ].join(";");

  bar.addEventListener("pointerdown", (e) => e.stopPropagation());
  bar.addEventListener("click", (e) => e.stopPropagation());

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "输入想对角色说的话...";
  input.style.cssText = [
    "flex: 1",
    "min-width: 0",
    "height: 36px",
    "padding: 0 12px",
    "border: 1px solid rgba(255, 255, 255, 0.22)",
    "border-radius: 8px",
    "background: rgba(255, 255, 255, 0.96)",
    "color: #0f172a",
    "font-size: 15px",
    "outline: none",
  ].join(";");

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "发送";
  button.style.cssText = [
    "flex: none",
    "height: 36px",
    "padding: 0 16px",
    "border: none",
    "border-radius: 8px",
    "background: #2563eb",
    "color: #ffffff",
    "font-size: 15px",
    "font-weight: 600",
    "cursor: pointer",
    "white-space: nowrap",
  ].join(";");

  const triggerSend = () => {
    const text = input.value.trim();
    if (text) input.value = "";
    onSubmit(text);
  };

  button.addEventListener("click", triggerSend);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.isComposing) {
      e.preventDefault();
      triggerSend();
    }
  });

  bar.append(input, button);
  host.appendChild(bar);
  return { bar, input };
}

// 【功能 1：在左上角创建可折叠、原生滚动的对话历史面板（含清空按钮）】
function createHistoryUI(
  host: HTMLElement,
  onClear: () => void
): { container: HTMLDivElement; listEl: HTMLDivElement } {
  document.getElementById(HISTORY_BOX_ID)?.remove();

  const container = document.createElement("div");
  container.id = HISTORY_BOX_ID;
  container.style.cssText = [
    "position: fixed",
    "top: calc(max(44px, env(safe-area-inset-top, 0px)) + 12px)",
    "left: 12px",
    "display: flex",
    "flex-direction: column",
    "align-items: flex-start",
    "gap: 8px",
    "font-family: system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    "z-index: 9999",
    "pointer-events: auto",
  ].join(";");

  container.addEventListener("pointerdown", (e) => e.stopPropagation());
  container.addEventListener("click", (e) => e.stopPropagation());
  container.addEventListener("wheel", (e) => e.stopPropagation());

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.textContent = "对话历史";
  toggleBtn.style.cssText = [
    "height: 36px",
    "padding: 0 12px",
    "border: 1px solid rgba(255, 255, 255, 0.16)",
    "border-radius: 10px",
    "background: rgba(15, 23, 42, 0.85)",
    "box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2)",
    "backdrop-filter: blur(8px)",
    "color: #ffffff",
    "font-size: 13px",
    "font-weight: 600",
    "cursor: pointer",
    "white-space: nowrap",
  ].join(";");

  const panel = document.createElement("div");
  panel.style.cssText = [
    "display: none",
    "flex-direction: column",
    "gap: 8px",
    "width: min(300px, calc(100vw - 32px))",
    "max-height: 260px",
    "padding: 10px",
    "box-sizing: border-box",
    "border-radius: 12px",
    "background: rgba(15, 23, 42, 0.88)",
    "color: #f8fafc",
    "font-size: 14px",
    "line-height: 1.45",
  ].join(";");

  const listEl = document.createElement("div");
  listEl.textContent = "暂无对话记录";
  listEl.style.cssText = [
    "flex: 1",
    "min-height: 60px",
    "max-height: 196px",
    "overflow-y: auto",
    "white-space: pre-wrap",
    "word-break: break-word",
    "padding-right: 4px",
  ].join(";");

  const footer = document.createElement("div");
  footer.style.cssText = "display: flex; justify-content: flex-end;";

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.textContent = "清空历史";
  clearBtn.style.cssText = [
    "height: 30px",
    "padding: 0 12px",
    "border: none",
    "border-radius: 6px",
    "background: #b91c1c",
    "color: #ffffff",
    "font-size: 13px",
    "font-weight: 600",
    "cursor: pointer",
  ].join(";");

  let isOpen = false;
  toggleBtn.addEventListener("click", () => {
    isOpen = !isOpen;
    panel.style.display = isOpen ? "flex" : "none";
  });
  clearBtn.addEventListener("click", onClear);

  footer.appendChild(clearBtn);
  panel.append(listEl, footer);
  container.append(toggleBtn, panel);
  host.appendChild(container);
  return { container, listEl };
}

export class MultiTurnAgent extends Behaviour {
  // 【Inspector 参数：模型设置】
  @serializable()
  model: string = "gpt-4o-mini";

  @serializable()
  systemPrompt: string =
    "你是一个 AR 情绪陪伴助手。用简短、温和的中文回应。不要诊断或承诺治疗。";

  @serializable()
  maxHistoryTurns: number = 6; // 最多保留最近几轮上下文（设为 0 或负数则不限制）

  // 【Inspector 参数：World Canvas 气泡】
  @serializable(Object3D)
  worldBubblePanel?: Object3D;

  @serializable(Text)
  worldBubbleText?: Text;

  @serializable(Button)
  closeBubbleButton?: Button;

  @serializable(Button)
  prevPageButton?: Button;

  @serializable(Button)
  nextPageButton?: Button;

  @serializable(Text)
  pageIndicatorText?: Text;

  private busy = false;
  private initialGreeting = "你好，有什么想聊的？";
  private pages: string[] = [];
  private pageIndex = 0;
  private history: ChatMessage[] = [];
  private displayLines: string[] = [];
  private apiKeyInput?: HTMLInputElement;
  private chatBar?: HTMLDivElement;
  private chatInput?: HTMLInputElement;
  private historyBox?: HTMLDivElement;
  private historyListEl?: HTMLDivElement;

  private getOverlayHost(): HTMLElement {
    return (
      this.context.arOverlayElement ??
      this.context.domElement ??
      document.body
    );
  }

  start() {
    const host = this.getOverlayHost();
    this.apiKeyInput = ensureApiKeyInput(host);
    const { bar, input } = createChatBar(host, (text) => this.handleSend(text));
    this.chatBar = bar;
    this.chatInput = input;

    const { container, listEl } = createHistoryUI(host, () => this.clearHistory());
    this.historyBox = container;
    this.historyListEl = listEl;
    this.initialGreeting = this.worldBubbleText?.text?.trim() || "你好，有什么想聊的？";

    if (this.worldBubblePanel) {
      GameObject.setActive(this.worldBubblePanel, false);
    }

    if (this.closeBubbleButton && this.worldBubblePanel) {
      this.closeBubbleButton.onClick.addEventListener(() => {
        if (this.worldBubblePanel) {
          GameObject.setActive(this.worldBubblePanel, false);
        }
      });
    }

    this.prevPageButton?.onClick.addEventListener(() => {
      if (this.pageIndex > 0) {
        this.pageIndex -= 1;
        this.renderCurrentPage();
      }
    });

    this.nextPageButton?.onClick.addEventListener(() => {
      if (this.pageIndex < this.pages.length - 1) {
        this.pageIndex += 1;
        this.renderCurrentPage();
      }
    });
  }

  onDestroy() {
    document.getElementById(API_KEY_CONTAINER_ID)?.remove();
    this.chatBar?.remove();
    this.chatBar = undefined;
    this.historyBox?.remove();
    this.historyBox = undefined;
  }

  onPointerClick() {
    this.chatInput?.focus();
    this.showBubble(this.initialGreeting);
    if (this.history.length === 0) {
      this.history = [{ role: "assistant", content: this.initialGreeting }];
      this.displayLines.push(`AI：${this.initialGreeting}`);
      if (this.historyListEl) {
        this.historyListEl.textContent = this.displayLines.join("\n\n");
      }
    }
  }

  // 【功能 2：读取 Key 与用户输入，连同上下文历史一起发送】
  async handleSend(message: string) {
    if (this.busy) return;

    const apiKey = this.apiKeyInput?.value.trim() ?? "";
    if (!apiKey) {
      this.apiKeyInput?.focus();
      this.showBubble("请先在右上角输入框填写 CloseAI API Key。");
      return;
    }

    if (!message) {
      this.chatInput?.focus();
      this.showBubble("请先在下方输入框里写一句话。");
      return;
    }

    const clipped = message.slice(0, MAX_INPUT_CHARS);
    this.busy = true;
    this.showBubble("正在思考…");

    const prompt =
      this.systemPrompt?.trim() ||
      "你是一个 AR 情绪陪伴助手。用简短、温和的中文回应。不要诊断或承诺治疗。";

    const keepPrev = Math.max(0, (this.maxHistoryTurns - 1) * 2);
    const trimmedPrev =
      this.maxHistoryTurns <= 0
        ? this.history
        : keepPrev === 0
          ? []
          : this.history.slice(-keepPrev);
    const nextHistory: ChatMessage[] = [
      ...trimmedPrev,
      { role: "user", content: clipped },
    ];

    let status = 0;
    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model?.trim() || "gpt-4o-mini",
          messages: [{ role: "system", content: prompt }, ...nextHistory],
        }),
      });
      status = response.status;

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(`请求失败（${status}）${data?.error?.message ?? ""}`);
      }

      const rawReply = data?.choices?.[0]?.message?.content;
      const reply =
        typeof rawReply === "string" && rawReply.trim() ? rawReply.trim() : "暂时没有回复";

      // 更新多轮上下文与可滚动历史面板
      this.history = [...nextHistory, { role: "assistant", content: reply }];
      this.appendHistoryDisplay(clipped, reply);
      this.showBubble(reply);
    } catch (error) {
      console.error("MultiTurnAgent 请求失败", error);
      this.showBubble(describeError(status));
    } finally {
      this.busy = false;
    }
  }

  // 【功能 3：分页并在 World Canvas 气泡中显示回复】
  private showBubble(text: string) {
    this.pages = paginateText(text);
    this.pageIndex = 0;
    this.renderCurrentPage();
    if (this.worldBubblePanel) {
      GameObject.setActive(this.worldBubblePanel, true);
    }
  }

  private renderCurrentPage() {
    const multi = this.pages.length > 1;
    const body = this.pages[this.pageIndex] ?? "";
    if (this.worldBubbleText) {
      this.worldBubbleText.text =
        multi && !this.pageIndicatorText
          ? `${body}\n[${this.pageIndex + 1}/${this.pages.length}]`
          : body;
    }
    if (this.pageIndicatorText) {
      GameObject.setActive(this.pageIndicatorText.gameObject, multi);
      if (multi) {
        this.pageIndicatorText.text = `${this.pageIndex + 1}/${this.pages.length}`;
      }
    }
    if (this.prevPageButton) {
      GameObject.setActive(this.prevPageButton.gameObject, multi);
    }
    if (this.nextPageButton) {
      GameObject.setActive(this.nextPageButton.gameObject, multi);
    }
  }

  // 【功能 4：把最新一轮对话追加到可滚动历史面板并自动滚到底部】
  private appendHistoryDisplay(userText: string, aiText: string) {
    this.displayLines.push(`你：${userText}\nAI：${aiText}`);
    if (this.historyListEl) {
      this.historyListEl.textContent = this.displayLines.join("\n\n");
      this.historyListEl.scrollTop = this.historyListEl.scrollHeight;
    }
  }

  // 【功能 5：清空多轮对话上下文与历史记录显示】
  clearHistory() {
    this.history = [];
    this.displayLines = [];
    if (this.historyListEl) {
      this.historyListEl.textContent = "暂无对话记录";
    }
  }
}
