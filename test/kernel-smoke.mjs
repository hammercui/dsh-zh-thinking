import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join, resolve } from "node:path";
import * as plugin from "../lib/index.js";

const root = process.argv[2] ?? process.env.DSH_KERNEL_NODE_MODULES;
assert.ok(root, "Pass a readable DSH node_modules path or DSH_KERNEL_NODE_MODULES (no archive scanning)");
const kernelRoot = resolve(root);
const { Context } = await import(pathToFileURL(join(kernelRoot, "@deepseek-ai/cordis/lib/index.js")).href);
const { default: SystemPrompt, renderPrompt } = await import(pathToFileURL(join(kernelRoot, "@deepseek-ai/dsh-system-prompt/lib/index.js")).href);
const ctx = new Context();
const kernel = ctx.plugin(SystemPrompt, { includeHarnessIdentity: false });
await kernel.await();
assert.ok(ctx.systemPrompt);
const mounted = ctx.plugin(plugin);
await mounted.await();
const context = (cwd) => ({ agent: { session: { header: { cwd } } } });
const prompt = async (input) => renderPrompt(await ctx.systemPrompt.assemble(input));
let checks = 0;
try {
	for (const cwd of [plugin.WORKSPACE, "d:/pythonproject/MEMPAPER/", "D:\\PythonProject\\memPaper\\."]) {
		assert.match(await prompt(context(cwd)), /当前工作区语言偏好/); checks++;
	}
	for (const cwd of [undefined, null, "", "memPaper", "D:memPaper", "D:\\PythonProject\\memPaper-other", "D:\\PythonProject\\memPaper\\child", "D:\\PythonProject\\other", "E:\\PythonProject\\memPaper"]) {
		assert.equal(await prompt(context(cwd)), ""); checks++;
	}
	for (const input of [{}, undefined, { cwd: plugin.WORKSPACE }, { agent: {} }, { agent: { session: {} } }]) {
		assert.equal(await prompt(input), ""); checks++;
	}
	const agentA = context(plugin.WORKSPACE);
	const agentB = context("D:\\webProject\\bilimusic");
	for (let i = 0; i < 3; i++) {
		const [a, b, again] = await Promise.all([prompt(agentA), prompt(agentB), prompt(agentA)]);
		assert.ok(a); assert.equal(b, ""); assert.equal(again, a); checks++;
	}
	agentA.agent.session.header.cwd = "D:\\PythonProject\\other";
	assert.equal(await prompt(agentA), ""); checks++;
	agentA.agent.session.header.cwd = plugin.WORKSPACE;
	const text = await prompt(agentA);
	assert.match(text, /用户明确要求其它语言时，遵从该要求/);
	assert.match(text, /英文摘要（English abstract）/);
	assert.doesNotMatch(text, /禁止以英文|一律为简体中文/); checks++;
	await mounted.dispose();
	assert.equal(await prompt(context(plugin.WORKSPACE)), ""); checks++;
	const disabled = ctx.plugin(plugin, { enabled: false });
	await disabled.await();
	assert.equal(await prompt(context(plugin.WORKSPACE)), ""); checks++;
	await disabled.dispose();
	console.log(`kernel-smoke: PASS (${checks} checks: isolation, fail-closed, English exception, live cwd, disposal, disabled)`);
} finally {
	await mounted.dispose();
	await kernel.dispose();
}
