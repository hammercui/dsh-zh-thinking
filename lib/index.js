/** Dependency-free, request-local language guidance for one workspace. */
import { win32 } from "node:path";

export const name = "zh-thinking";
export const inject = ["systemPrompt"];
export const WORKSPACE = "D:\\PythonProject\\memPaper";
const SECTION_NAME = "language:zh-thinking";

// Only fully qualified Windows drive paths are accepted. No process cwd fallback,
// prefix matching, filesystem traversal, environment expansion or cached agent state.
function normalizeWorkspace(value) {
	if (typeof value !== "string" || !/^[a-z]:[\\/]/i.test(value) || /[\u0000-\u001f]/.test(value)) return undefined;
	return win32.normalize(value).replace(/[\\/]+$/, "").toLowerCase();
}
const TARGET = normalizeWorkspace(WORKSPACE);
const GUIDANCE_ZH =
	"当前工作区语言偏好：规划、工具调用说明、自我检查及可见的推理摘要默认使用简体中文。" +
	"最终回复默认使用简体中文；用户明确要求其它语言时，遵从该要求，" +
	"例如英文摘要（English abstract）、英文论文段落或全文英文回复应按要求使用英文。" +
	"代码、标识符、专有名词、引文和用户原文可保留原语言。" +
	"此偏好不要求披露隐藏思维链，也不保证模型内部推理的语言。";

/** Real DSH AssembleContext.agent.session.header.cwd, resolved on EVERY assembly. */
export function languageForAssembly(context) {
	return normalizeWorkspace(context?.agent?.session?.header?.cwd) === TARGET ? GUIDANCE_ZH : "";
}

export function apply(ctx, config) {
	ctx.effect(() => {
		if (config?.enabled === false) return;
		try {
			return ctx.systemPrompt.section({
				name: SECTION_NAME,
				order: 20,
				interpolate: false,
				text: languageForAssembly
			});
		} catch (error) {
			ctx.logger?.warn?.("dsh-zh-thinking: register section failed: " +
				(error instanceof Error ? error.message : String(error)));
		}
	}, "dsh-zh-thinking: workspace language section");
}
