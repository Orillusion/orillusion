/**
 * Static reachability over a preprocessed WGSL module: which module-scope
 * identifiers can an entry point touch, following function calls?
 *
 * Used to give each texture / sampler binding only the stage visibility it
 * needs. Bind group layouts count every VERTEX-visible sampled texture
 * against the vertex stage's 16-texture limit even when only the fragment
 * entry point reads it, so a PBR material with all its optional maps bound
 * would otherwise fail to build a layout.
 * @internal
 */
export class ShaderStageUsage {
    private static readonly IDENT = /[A-Za-z_][A-Za-z0-9_]*/g;

    /** Map of function name → body text (brace-matched), for every `fn` in the module. */
    public static functionBodies(code: string): Map<string, string> {
        const out = new Map<string, string>();
        const re = /\bfn\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(code))) {
            const open = code.indexOf('{', m.index);
            if (open < 0) break;
            let depth = 0, i = open;
            for (; i < code.length; i++) {
                const c = code[i];
                if (c == '{') depth++;
                else if (c == '}') { depth--; if (depth == 0) break; }
            }
            // Include the signature so parameter default/attribute references count too.
            out.set(m[1], code.substring(m.index, i + 1));
            re.lastIndex = i + 1;
        }
        return out;
    }

    /** Every identifier reachable from `entry` through the call graph (functions included). */
    public static reachableIdentifiers(code: string, entry: string): Set<string> {
        const bodies = ShaderStageUsage.functionBodies(code);
        const seen = new Set<string>();
        const queue = [entry];
        while (queue.length) {
            const fn = queue.pop()!;
            const body = bodies.get(fn);
            if (!body || seen.has(fn)) continue;
            seen.add(fn);
            const ids = body.match(ShaderStageUsage.IDENT);
            if (!ids) continue;
            for (const id of ids) {
                if (!seen.has(id)) {
                    seen.add(id);
                    if (bodies.has(id)) queue.push(id);
                }
            }
        }
        return seen;
    }
}
