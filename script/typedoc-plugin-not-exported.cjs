"use strict";
/**
 * typedoc-plugin-not-exported
 * TypeDoc plugin that forces inclusion of non-exported symbols (variables)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const typedoc_1 = require("typedoc"); // version 0.20.16+
const ModuleFlags = typedoc_1.TypeScript.SymbolFlags.ValueModule | typedoc_1.TypeScript.SymbolFlags.NamespaceModule;
exports.load = function (application) {
    /** @type {Map<Reflection, Set<TypeScript.SourceFile>>} */
    const checkedForModuleExports = new Map();
    let includeTag = 'notExported';
    application.options.addDeclaration({
        name: 'includeTag',
        help: '[typedoc-plugin-not-exported] Specify the tag name for non-exported member to be imported under',
        defaultValue: includeTag,
    });
    application.converter.on(typedoc_1.Converter.EVENT_BEGIN, () => {
        const includeTagTemp = application.options.getValue('includeTag');
        if (typeof includeTagTemp === 'string') {
            includeTag = includeTagTemp.toLocaleLowerCase();
        }
    });
    application.converter.on(typedoc_1.Converter.EVENT_CREATE_DECLARATION, lookForFakeExports);
    application.converter.on(typedoc_1.Converter.EVENT_END, () => {
        checkedForModuleExports.clear();
    });
    function lookForFakeExports(context, reflection) {
        // Figure out where "not exports" will be placed, go up the tree until we get to
        // the module where it belongs.
        let targetModule = reflection;
        while (!targetModule.kindOf(typedoc_1.ReflectionKind.Module | typedoc_1.ReflectionKind.Project)) {
            targetModule = targetModule.parent;
        }
        const moduleContext = context.withScope(targetModule);
        const reflSymbol = context.project.getSymbolFromReflection(reflection);
        if (!reflSymbol) {
            // Global file, no point in doing anything here. TypeDoc will already
            // include everything declared in this file.
            return;
        }
        for (const declaration of reflSymbol.declarations || []) {
            checkFakeExportsOfFile(declaration.getSourceFile(), moduleContext);
        }
    }
    function checkFakeExportsOfFile(file, context) {
        const moduleSymbol = context.checker.getSymbolAtLocation(file);
        // Make sure we are allowed to call getExportsOfModule
        if (!moduleSymbol || (moduleSymbol.flags & ModuleFlags) === 0) {
            return;
        }
        const checkedScopes = checkedForModuleExports.get(context.scope) || new Set();
        checkedForModuleExports.set(context.scope, checkedScopes);
        if (checkedScopes.has(file))
            return;
        checkedScopes.add(file);
        const exportedSymbols = context.checker.getExportsOfModule(moduleSymbol);
        const symbols = context.checker
            .getSymbolsInScope(file, typedoc_1.TypeScript.SymbolFlags.ModuleMember)
            .filter((symbol) => {
            var _a;
            return ((_a = symbol.declarations) === null || _a === void 0 ? void 0 : _a.some((d) => d.getSourceFile() === file)) &&
                !exportedSymbols.includes(symbol);
        });
        for (const symbol of symbols) {
            if (symbol
                .getJsDocTags()
                .some((tag) => tag.name.toLocaleLowerCase() === includeTag)) {
                context.converter.convertSymbol(context, symbol);
            }
        }
    }
};
