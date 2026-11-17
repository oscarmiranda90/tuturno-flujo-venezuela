#!/usr/bin/env node
/** Verificación del español neutro. Tu Turno es un producto venezolano. Revisa los textos y señala el archivo y la línea cuando aparece voseo. Conserva los términos venezolanos correctos: el pote, cédula, RIF y SAN. Ejecuta npm run check:language. */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = 'src';
const EXTENSIONS = new Set(['.ts', '.tsx']);

/** Pronombres y formas verbales de voseo de segunda persona. */
const FORBIDDEN_WORDS = [
  'sos', 'vos', 'acá', 'allá', 'tenés', 'querés', 'podés', 'sabés',
  'hacés', 'ponés', 'venís', 'decís', 'vivís', 'salís', 'seguís',
  'cobrás', 'pagás', 'llevás', 'dejás', 'creés', 'debés',
];

/** Imperativos de voseo con acento en la última sílaba, como «pagá», «elegí» y «sumá». La vocal acentuada debe cerrar la palabra para evitar coincidencias parciales dentro de «todavía» o «Escríbelos». */
const IMPERATIVE = /\b[A-Za-zÁÉÍÓÚÑáéíóúñ]{3,}[áí](?![A-Za-zÁÉÍÓÚÑáéíóúñ])/g;

/** Palabras válidas del español neutro que terminan en vocal acentuada y no deben marcarse como imperativos. */
const ALLOWED = new Set([
  // Palabras comunes que terminan en vocal acentuada.
  'está', 'aquí', 'allí', 'ahí', 'así', 'día', 'país', 'maní', 'aún',
  // Pasado de primera persona del testimonio aprobado; no es un imperativo.
  'surtí',
  // Futuro de tercera persona.
  'será', 'habrá', 'tendrá', 'podrá', 'estará', 'vendrá', 'dará',
  'aparecerá', 'aplicará', 'quedará', 'llegará', 'seguirá', 'irá',
  // Nombres propios de los datos de prueba.
  'tomás', 'andrés', 'inés', 'josé', 'jesús', 'nicolás',
]);

const problems = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!EXTENSIONS.has(extname(full))) continue;
    check(full);
  }
}

function check(file) {
  const lines = readFileSync(file, 'utf8').split('\n');
  let inBlockComment = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Los comentarios no se muestran al usuario y se excluyen de la búsqueda de voseo.
    if (trimmed.startsWith('/*')) inBlockComment = true;
    if (inBlockComment) {
      if (trimmed.includes('*/')) inBlockComment = false;
      return;
    }
    if (trimmed.startsWith('*') || trimmed.startsWith('//')) return;

    const lower = line.toLowerCase();

    for (const word of FORBIDDEN_WORDS) {
      const pattern = new RegExp(`\\b${word}\\b`, 'i');
      if (pattern.test(lower)) {
        problems.push({ file, line: index + 1, encontrado: word, text: trimmed });
      }
    }

    for (const match of line.matchAll(IMPERATIVE)) {
      const word = match[0];
      if (ALLOWED.has(word.toLowerCase())) continue;
      problems.push({ file, line: index + 1, encontrado: word, text: trimmed });
    }
  });
}

walk(ROOT);

if (problems.length === 0) {
  console.log('✓ Español neutro: no se encontraron formas rioplatenses');
  process.exit(0);
}

console.error(`\n✗ ${problems.length} formas rioplatenses encontradas.\n`);
console.error('  Este producto es venezolano. Usa español neutro:');
console.error('  tú en lugar de vos · paga en lugar de pagá · aquí en lugar de acá · eres en lugar de sos\n');

for (const p of problems) {
  console.error(`  ${p.file}:${p.line}`);
  console.error(`    encontrado: "${p.found}"`);
  console.error(`    línea: ${p.text.slice(0, 80)}\n`);
}

process.exit(1);
