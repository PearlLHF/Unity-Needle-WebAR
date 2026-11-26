/*
 * AskAgent.ts
 * W3 第三部分第 1 步（单轮对话）的 Needle 组件。
 *
 * 【功能】
 * 1. 在 Needle 的 arOverlayElement 里创建右上角密码形式 API Key 输入框和底部输入栏
 *    （使用原生 HTML，支持密码圆点和中文输入法，且手机进入 WebXR AR 后依然可见）。
 * 2. 直接请求 CloseAI 的 Chat Completions 接口（每次只发当前这一句，没有对话记忆）。
 * 3. 在物体上方的 World Canvas 气泡（worldBubblePanel / worldBubbleText）显示回复，
 *    回复较长时自动分页，可通过 PrevPageButton（▲）/ NextPageButton（▼）上下翻页。
 *
 * 【放在哪里】
 * 复制到 Needle Web 项目的 src/scripts/ai/AskAgent.ts。
 * 保存后回到 Unity，等待 Unity 生成同名的 AskAgent 组件。
 *
 * 【怎么挂载】
 * 1. 把预制体 AgentWorldBubble.prefab 拖进 Hierarchy（添加 LookAt 指向 Camera）。
 * 2. 在 Hierarchy 里选中 Cube，Add Component 搜索 AskAgent 并添加。
 * 3. 把 BubblePanel、BubbleText、CloseBubbleButton、PrevPageButton、NextPageButton 拖入对应栏位，保存场景。
 * 4. 升级到第 2 步多轮对话（MultiTurnAgent.ts）时，沿用同一个 AgentWorldBubble，
 *    只需把 Cube 上的 AskAgent 换成 MultiTurnAgent 即可。
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
const API_KEY_CONTAINER_ID = "closeai-api-key-box";
const API_KEY_INPUT_ID = "closeai-api-key-input";
const CHAT_BAR_ID = "agent-chat-input-bar";
const BUBBLE_LINE_UNITS = 11.5; // 每行约 11 个汉字（208px / 16px）
const BUBBLE_MAX_LINES = 3; // 每页最多 3 行正文，第 4 行留给页码

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
  if (status === 401) return "Key 无效（401）。检查右上角输入的 Key 有没有复制完整，是不是 CloseAI 的 Key。";
  if (status === 429) return "请求被限制（429）。可能是余额不足或请求太频繁，稍后再试。";
  if (status === 0) return "网络错误，没有连上 api.openai-proxy.org。检查网络后再试。";
  return `请求失败（${status}），稍后重试。详细原因见浏览器 Console。`;
}

// 【功能 1a：在 Needle AR Overlay 容器中创建密码形式的 API Key 输入框】
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

// 【功能 1b：在 Needle AR Overlay 容器中创建底部紧凑输入栏】
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

export class AskAgent extends Behaviour {
  // 【Inspector 参数：模型设置】
  @serializable()
  model: string = "gpt-4o-mini";

  @serializable()
  systemPrompt: string =
    "你是一个 AR 情绪陪伴助手。用简短、温和的中文回应。不要诊断或承诺治疗。";

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
  private apiKeyInput?: HTMLInputElement;
  private chatBar?: HTMLDivElement;
  private chatInput?: HTMLInputElement;

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
  }

  // 【功能 2：点击物体时把光标定位到底部输入框并打招呼】
  onPointerClick() {
    this.chatInput?.focus();
    this.showBubble(this.initialGreeting);
  }

  // 【功能 3：读取 Key 和当前这一句话，发给 CloseAI（单轮，无记忆）】
  async handleSend(message: string) {
    if (this.busy) return;

    const apiKey = this.apiKeyInput?.value.trim() ?? "";
    if (!apiKey) {
      this.apiKeyInput?.focus();
      this.showBubble("请先在右上角输入框填写 CloseAI API Key（sk-...）。");
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
          messages: [
            {
              role: "system",
              content:
                this.systemPrompt?.trim() ||
                "你是一个 AR 情绪陪伴助手。用简短、温和的中文回应。不要诊断或承诺治疗。",
            },
            {
              role: "assistant",
              content: this.initialGreeting,
            },
            { role: "user", content: clipped },
          ],
        }),
      });
      status = response.status;

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(`请求失败（${status}）${data?.error?.message ?? ""}`);
      }

      const reply = data?.choices?.[0]?.message?.content;
      this.showBubble(typeof reply === "string" && reply.trim() ? reply.trim() : "暂时没有回复");
    } catch (error) {
      console.error("AskAgent 请求失败", error);
      this.showBubble(describeError(status));
    } finally {
      this.busy = false;
    }
  }

  // 【功能 4：分页并在 World Canvas 气泡中显示回复】
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
}
