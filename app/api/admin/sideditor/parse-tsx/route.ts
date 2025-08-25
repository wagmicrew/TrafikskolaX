import { NextRequest, NextResponse } from 'next/server';
import * as ts from 'typescript';
import { requireAuth } from '@/lib/auth/server-auth';

// Minimal Puck Data shape used by the client
interface PuckBlock {
  type: string;
  props: Record<string, any>;
}

interface PuckData {
  content: PuckBlock[];
  root?: { props?: Record<string, any> };
}

function getAttr(attrs: readonly ts.JsxAttributeLike[] | undefined, name: string): string | undefined {
  if (!attrs) return undefined;
  for (const attr of attrs) {
    if (ts.isJsxAttribute(attr)) {
      const attrName = attr.name.text;
      if (attrName === name) {
        const init = attr.initializer;
        if (!init) return '';
        if (ts.isStringLiteral(init)) return init.text;
        if (ts.isJsxExpression(init)) {
          const expr = init.expression;
          if (!expr) return '';
          if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) return expr.text;
          try {
            return String((expr as any).text ?? '');
          } catch {
            return '';
          }
        }
      }
    }
  }
  return undefined;
}

function collectText(node: ts.Node): string {
  let text = '';
  function visit(n: ts.Node) {
    if (ts.isJsxText(n)) {
      text += n.getText().replace(/\s+/g, ' ').trim();
    } else if (ts.isStringLiteral(n)) {
      text += n.text;
    } else if (ts.isJsxExpression(n) && n.expression && ts.isStringLiteral(n.expression)) {
      text += n.expression.text;
    } else {
      n.forEachChild(visit);
    }
  }
  node.forEachChild(visit);
  return text.trim();
}

function toPuckBlocksFromJsx(node: ts.Node, blocks: PuckBlock[]) {
  node.forEachChild(child => {
    if (ts.isJsxElement(child)) {
      const opening = child.openingElement;
      const tagName = opening.tagName.getText();

      // Normalize HTML class -> className
      const className = getAttr(opening.attributes?.properties as any, 'className')
        ?? getAttr(opening.attributes?.properties as any, 'class');

      // Headings
      const headingMatch = tagName.match(/^h([1-6])$/i);
      if (headingMatch) {
        const level = headingMatch[1];
        blocks.push({
          type: 'Heading',
          props: {
            children: collectText(child),
            level,
            style: 'default'
          }
        });
      }

      // Paragraphs
      else if (/^p$/i.test(tagName)) {
        blocks.push({
          type: 'Paragraph',
          props: {
            children: collectText(child),
            align: 'left'
          }
        });
      }

      // Lists
      else if (/^ul$/i.test(tagName) || /^ol$/i.test(tagName)) {
        const ordered = /^ol$/i.test(tagName);
        const items: { content: string }[] = [];
        child.forEachChild(c => {
          if (ts.isJsxElement(c) && c.openingElement.tagName.getText().toLowerCase() === 'li') {
            items.push({ content: collectText(c) });
          }
        });
        blocks.push({ type: 'List', props: { ordered, items } });
      }

      // Links
      else if (/^a$/i.test(tagName)) {
        const href = getAttr(opening.attributes?.properties as any, 'href') ?? '';
        const target = getAttr(opening.attributes?.properties as any, 'target') ?? '_self';
        blocks.push({
          type: 'Link',
          props: {
            href,
            target,
            children: collectText(child)
          }
        });
      }

      // Section (map some common Tailwind props)
      else if (/^section$/i.test(tagName) || /^div$/i.test(tagName)) {
        if (className && /(bg-|py-|text-)/.test(className)) {
          const bgClass = className.match(/bg-[\w-]+/)?.[0] ?? 'bg-white';
          const padding = className.match(/py-[\w-]+/)?.[0] ?? 'py-16';
          const textColor = className.match(/text-[\w-]+/)?.[0] ?? 'text-gray-900';
          blocks.push({ type: 'Section', props: { backgroundColor: bgClass, padding, textColor } });
        }
      }

      // Custom components we know about
      else if (/^Hero$/.test(tagName)) {
        const title = getAttr(opening.attributes?.properties as any, 'title') ?? collectText(child);
        const subtitle = getAttr(opening.attributes?.properties as any, 'subtitle') ?? '';
        const backgroundColor = getAttr(opening.attributes?.properties as any, 'backgroundColor') ?? 'bg-blue-600';
        blocks.push({ type: 'Hero', props: { title, subtitle, backgroundColor } });
      }

      // Recurse for nested JSX
      toPuckBlocksFromJsx(child, blocks);
    }

    if (ts.isJsxSelfClosingElement(child)) {
      const tagName = child.tagName.getText();
      const attrs = child.attributes?.properties as any;

      // Image
      if (/^img$/i.test(tagName)) {
        const src = getAttr(attrs, 'src') ?? '';
        const alt = getAttr(attrs, 'alt') ?? '';
        const width = getAttr(attrs, 'width') ?? 'auto';
        const height = getAttr(attrs, 'height') ?? 'auto';
        blocks.push({ type: 'Image', props: { src, alt, width, height } });
      }

      // Button (anchor-like component)
      else if (/^Button$/.test(tagName)) {
        const text = getAttr(attrs, 'text') ?? '';
        const href = getAttr(attrs, 'href') ?? '';
        const variant = getAttr(attrs, 'variant') ?? 'primary';
        blocks.push({ type: 'Button', props: { text, href, variant } });
      }
    }
  });
}

function parseTsxToPuck(tsx: string): PuckData {
  const source = ts.createSourceFile('temp.tsx', tsx, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const content: PuckBlock[] = [];
  toPuckBlocksFromJsx(source, content);
  return { content, root: { props: {} } };
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth('admin');

    const body = await request.json();
    const tsx: string | undefined = body?.content;

    if (!tsx || typeof tsx !== 'string') {
      return NextResponse.json({ error: 'content (TSX) is required' }, { status: 400 });
    }

    const data = parseTsxToPuck(tsx);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('parse-tsx error:', error);
    return NextResponse.json({ error: 'Failed to parse TSX' }, { status: 500 });
  }
}
