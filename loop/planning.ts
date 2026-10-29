import fs from 'node:fs';
import path from 'node:path';
import { PLANNING_DIR } from './paths.ts';

/** A dated progress note the PO appends: "This cycle (55) ..." or "Queue order (cycle 55): ...". */
const CYCLE_NOTE = /^(This cycle \((\d+)\)|Queue order \(cycle (\d+)\))/;
const noteKind = (para: string): string | undefined => CYCLE_NOTE.exec(para)?.[1]?.replace(/\d+/, 'N');
/** A done epic's heading; not the stub archiveRoadmap leaves behind. */
const DONE_HEADING = /^### (.+?) \(done\b(?!; history in)/;

export interface ArchivedRoadmap {
  /** The roadmap with history taken out. */
  kept: string;
  /** What was taken out, as markdown for planning/archive/ROADMAP.md; empty when nothing was. */
  archived: string;
}

/**
 * Takes the history out of ROADMAP.md, without a model: every done epic (a `### ... (done` section)
 * moves out whole and leaves a one-line stub, and in every other section only the newest
 * "This cycle (N)" and "Queue order (cycle N)" notes stay. The PO wrote one of those per epic per
 * cycle and the roadmap grew to 110 KB, past what it could rewrite in one response.
 */
export function archiveRoadmap(text: string, archiveRel = 'planning/archive/ROADMAP.md'): ArchivedRoadmap {
  // Split into sections at every heading; each section is its heading plus its paragraphs.
  const sections: string[][] = [];
  for (const para of text.split(/\n{2,}/)) {
    for (const [i, chunk] of para.split(/\n(?=#{1,3} )/).entries()) {
      if (i > 0 || /^#{1,3} /.test(chunk) || sections.length === 0) sections.push([chunk]);
      else sections.at(-1)!.push(chunk);
    }
  }
  const kept: string[] = [];
  const archived: string[] = [];
  for (const section of sections) {
    const done = DONE_HEADING.exec(section[0]!);
    if (done) {
      archived.push(section.join('\n\n'));
      kept.push(`### ${done[1]} (done; history in ${archiveRel})`);
      continue;
    }
    // Keep the last note of each kind; archive the earlier ones under this section's heading.
    const lastOfKind = new Map<string, number>();
    section.forEach((p, i) => {
      const kind = noteKind(p);
      if (kind) lastOfKind.set(kind, i);
    });
    const old = section.filter((p, i) => noteKind(p) && lastOfKind.get(noteKind(p)!) !== i);
    if (old.length) archived.push(`${section[0]!.split('\n')[0]!.replace(/^#+ /, '### ')} (older notes)\n\n${old.join('\n\n')}`);
    kept.push(section.filter((p) => !old.includes(p)).join('\n\n'));
  }
  return { kept: `${kept.join('\n\n').trimEnd()}\n`, archived: archived.join('\n\n') };
}

/** Runs archiveRoadmap on the project's ROADMAP.md, appending what it takes out to planning/archive/ROADMAP.md. Returns the bytes moved. */
export function archivePlanning(dir = PLANNING_DIR): number {
  const roadmap = path.join(dir, 'ROADMAP.md');
  if (!fs.existsSync(roadmap)) return 0;
  const before = fs.readFileSync(roadmap, 'utf8');
  const { kept, archived } = archiveRoadmap(before);
  if (!archived) return 0;
  const archive = path.join(dir, 'archive', 'ROADMAP.md');
  fs.mkdirSync(path.dirname(archive), { recursive: true });
  const current = fs.existsSync(archive) ? fs.readFileSync(archive, 'utf8') : '# Roadmap history\n\nMoved out of ROADMAP.md by the runner. The PO does not read this.\n';
  fs.writeFileSync(archive, `${current.trimEnd()}\n\n## Archived ${new Date().toISOString().slice(0, 10)}\n\n${archived}\n`);
  fs.writeFileSync(roadmap, kept);
  return Buffer.byteLength(before) - Buffer.byteLength(kept);
}
