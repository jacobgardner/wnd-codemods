//
// import * as t from 'ast-types';
import {
  API,
  ASTNode,
  CallExpression,
  Collection,
  FileInfo,
  ImportDeclaration,
  VariableDeclaration,
} from 'jscodeshift';
import * as util from 'util';
import {sourceOutput} from './config';
import {manualComment} from './utils';

// function isRequire(expression: ASTNode): expression is CallExpression {
//   return (
//     expression.type === 'CallExpression' &&
//     expression.callee.type === 'Identifier' &&
//     expression.callee.name === 'require'
//   );
// }

interface RequireDetails {
  requireLiteral: string;
  member?: string;
  unsupported?: boolean;
}

function extractRequire(expression: ASTNode): RequireDetails | undefined {
  if (
    expression.type === 'CallExpression' &&
    expression.callee.type === 'Identifier' &&
    expression.callee.name === 'require'
  ) {
    if (
      expression.arguments.length !== 1 ||
      expression.arguments[0].type !== 'Literal' ||
      typeof expression.arguments[0].value !== 'string'
    ) {
      return {
        requireLiteral: '',
        unsupported: true,
      };
    }

    return {
      requireLiteral: expression.arguments[0].value,
    };
  } else if (expression.type === 'MemberExpression') {
    if (expression.object.type !== 'CallExpression') {
      // Don't support nested members
      return;
    }

    const deets = extractRequire(expression.object);

    if (deets && expression.property.type === 'Identifier') {
      return {
        ...deets,
        member: expression.property.name,
      };
    }
  }

  return;
}

export default function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift;

  const root = j(file.source);

  root.find(j.ExpressionStatement).filter((p) => !!extractRequire(p.value.expression)).replaceWith(p => {

    const r = extractRequire(p.value.expression);

    if (r && !r.unsupported) {
      return j.importDeclaration([], j.literal(r.requireLiteral))

    }

    return p.value;

  });

  root
    .find(j.VariableDeclaration)
    .filter(
      (path) =>
        !!path.value.declarations.find((d) => {
          if (d.type === 'VariableDeclarator' && !!extractRequire(d.init)) {
            return true;
          }

          return false;
        })
    )
    .replaceWith((p) => {
      const returnValues: ASTNode[] = [];

      let bail = false;

      p.value.declarations.forEach((d) => {
        if (d.type === 'VariableDeclarator') {
          const r = extractRequire(d.init);

          if (r && r.unsupported) {
            bail = true;
            return;
          }

          if (r) {
            const specifiers = [];

            if (d.id.type === 'Identifier') {
              if (r.member) {
                specifiers.push(j.importSpecifier(j.identifier(r.member), d.id));
              } else {
                specifiers.push(j.importDefaultSpecifier(d.id));
              }
            } else if (d.id.type === 'ObjectPattern') {
              for (const prop of d.id.properties) {
                if (prop.type === 'Property') {
                  if (prop.key.type !== 'Identifier') {
                    bail = true;
                    return;
                  }

                  if (prop.value && prop.value.type !== 'Identifier') {
                    bail = true;
                    return;
                  }

                  specifiers.push(
                    j.importSpecifier(
                      prop.key,
                      prop.value && prop.value.type === 'Identifier' ? prop.value : undefined
                    )
                  );
                } else {
                  bail = true;
                  return;
                }
              }
            } else {
              bail = true;
              return;
            }

            return returnValues.push(j.importDeclaration(specifiers, j.literal(r.requireLiteral)));
          } else {
            returnValues.push(
              j.variableDeclaration(p.value.kind, [j.variableDeclarator(d.id, d.init)])
            );
          }
        }
      });


      // Don't automatically convert lazy imports
      if (p.parent.value.type !== 'Program') {
        bail = true;
      }
      
      if (bail) {
        p.value.comments = [
          j.commentLine(manualComment('Unable to automatically transform to import')),
        ];

        return p.value;
      }

      return returnValues;
    });

  return root.toSource(sourceOutput);
}
