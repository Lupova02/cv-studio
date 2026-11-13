import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import type { CvLanguage } from '@shared/cv/cv-data';
import type { CvLibraryEntry } from '@shared/cv/cv-library';
import { CvState } from '../../../core/state/cv-state';
import { EditorCopy } from '../../../core/state/editor-copy';
import { TrashIcon } from '../../../ui/trash-icon/trash-icon';

const DATE_LOCALE: Record<CvLanguage, string> = { de: 'de-DE', en: 'en-GB', tr: 'tr-TR' };

/**
 * Lebenslauf-Auswahl in der Werkzeugleiste: zeigt den Namen des geöffneten Lebenslaufs und öffnet eine Liste
 * aller gespeicherten zum Wechseln, Anlegen, Umbenennen, Duplizieren und Löschen.
 */
@Component({
  selector: 'app-library-menu',
  imports: [TrashIcon],
  host: {
    '(document:pointerdown)': 'closeOnOutside($event)',
    '(keydown.escape)': 'close()',
  },
  template: `
    <button
      type="button"
      class="switcher"
      [attr.aria-expanded]="open()"
      aria-haspopup="dialog"
      [attr.title]="copy.ui().documents"
      (click)="toggle()"
    >
      <svg class="doc" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </svg>
      <span class="name">{{ activeName() }}</span>
      <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
    </button>
    @if (open()) {
      <div class="popover" role="dialog" [attr.aria-label]="copy.ui().documents">
        <div class="head">
          <h3>{{ copy.ui().documents }}</h3>
          <button type="button" class="btn-solid" (click)="create()" [disabled]="state.busy()">+ {{ copy.ui().newCv }}</button>
        </div>
        <ul>
          @for (entry of entries(); track entry.id) {
            <li [class.active]="entry.id === activeId()">
              @if (renaming() === entry.id) {
                <form class="rename" (submit)="$event.preventDefault(); saveRename(entry)">
                  <input
                    #renameInput
                    [value]="entry.name"
                    maxlength="80"
                    [attr.aria-label]="copy.ui().renameCv"
                    (keydown.escape)="$event.stopPropagation(); renaming.set(null)"
                  />
                  <button type="submit" class="btn-solid">{{ copy.ui().save }}</button>
                </form>
              } @else {
                <button type="button" class="open" (click)="openCv(entry)" [disabled]="state.busy()" [attr.aria-current]="entry.id === activeId() ? 'true' : null">
                  <span class="title">{{ entry.name }}</span>
                  <span class="meta">
                    @if (entry.id === activeId()) {
                      <span class="badge">{{ copy.ui().cvOpen }}</span>
                    }
                    {{ copy.ui().lastEdited }}: {{ formatDate(entry.updatedAt) }}
                  </span>
                </button>
                <div class="row-actions">
                  <button type="button" class="icon-btn" (click)="startRename(entry)" [attr.aria-label]="copy.ui().renameCv + ': ' + entry.name" [attr.title]="copy.ui().renameCv">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></svg>
                  </button>
                  <button type="button" class="icon-btn" (click)="duplicate(entry)" [disabled]="state.busy()" [attr.aria-label]="copy.ui().duplicateCv + ': ' + entry.name" [attr.title]="copy.ui().duplicateCv">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>
                  </button>
                  <button type="button" class="icon-btn danger" (click)="remove(entry)" [disabled]="state.busy() || entries().length < 2" [attr.aria-label]="copy.ui().deleteCv + ': ' + entry.name" [attr.title]="copy.ui().deleteCv">
                    <app-trash-icon />
                  </button>
                </div>
              }
            </li>
          }
        </ul>
      </div>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      min-width: 0;
    }

    .switcher {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      max-width: 100%;
      min-height: var(--tap);
      padding: 0.3rem 0.6rem;
      border-color: var(--border);
      background: var(--surface-2);
      color: var(--text);
      font-weight: 600;
      font-size: 0.9rem;
    }

    .switcher svg {
      flex: none;
      width: 1.05rem;
      height: 1.05rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .switcher .chevron {
      color: var(--text-subtle);
      transition: transform var(--medium) var(--ease);
    }

    .switcher[aria-expanded='true'] .chevron {
      transform: rotate(180deg);
    }

    .name {
      min-width: 0;
      max-width: 16rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .popover {
      top: calc(100% + 0.4rem);
      left: 0;
      width: 24rem;
    }

    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .head h3 {
      margin: 0;
    }

    ul {
      display: grid;
      gap: 0.3rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem;
      border: 1px solid transparent;
      border-radius: var(--radius);
    }

    li.active {
      border-color: color-mix(in srgb, var(--accent) 40%, transparent);
      background: var(--accent-soft);
    }

    .open {
      display: grid;
      flex: 1;
      min-width: 0;
      gap: 0.1rem;
      padding: 0.35rem 0.5rem;
      border: 0;
      background: transparent;
      text-align: left;
    }

    .open:hover:not(:disabled) {
      background: var(--surface-2);
    }

    li.active .open:hover:not(:disabled) {
      background: transparent;
    }

    .title {
      overflow: hidden;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .meta {
      color: var(--text-subtle);
      font-size: 0.76rem;
    }

    .badge {
      margin-right: 0.3rem;
      padding: 0 0.4rem;
      border-radius: 999px;
      background: var(--accent);
      color: var(--on-accent);
      font-weight: 600;
    }

    .row-actions {
      display: flex;
      gap: 0.2rem;
    }

    .rename {
      display: flex;
      flex: 1;
      gap: 0.4rem;
    }

    @media (max-width: 640px) {
      .switcher {
        gap: 0.3rem;
        padding: 0.3rem 0.45rem;
      }

      .switcher .doc {
        display: none;
      }

      .name {
        max-width: 8.5rem;
      }

      .popover {
        position: fixed;
        left: 0.75rem;
        right: 0.75rem;
        width: auto;
        max-width: none;
        top: calc(3.9rem + env(safe-area-inset-top));
        max-height: calc(100dvh - 9.5rem - env(safe-area-inset-top) - env(safe-area-inset-bottom));
      }
    }
  `,
})
export class LibraryMenu {
  protected readonly state = inject(CvState);
  protected readonly copy = inject(EditorCopy);
  protected readonly open = signal(false);
  /** Kennung des Lebenslaufs, dessen Name gerade bearbeitet wird. */
  protected readonly renaming = signal<string | null>(null);
  protected readonly entries = computed(() => this.state.library()?.entries ?? []);
  protected readonly activeId = computed(() => this.state.library()?.activeId ?? '');
  protected readonly activeName = computed(
    () => this.entries().find((entry) => entry.id === this.activeId())?.name ?? this.copy.ui().cvDefaultName,
  );

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renameInput = viewChild<ElementRef<HTMLInputElement>>('renameInput');

  protected toggle(): void {
    this.open.update((value) => !value);
    this.renaming.set(null);
  }

  protected close(): void {
    this.open.set(false);
    this.renaming.set(null);
  }

  /** Schließt bei Klick außerhalb des Menüs. */
  protected closeOnOutside(event: PointerEvent): void {
    if (this.open() && event.target instanceof Node && !this.host.contains(event.target)) {
      this.close();
    }
  }

  protected formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || date.getTime() === 0) {
      return '–';
    }
    return new Intl.DateTimeFormat(DATE_LOCALE[this.copy.language()], { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  protected async openCv(entry: CvLibraryEntry): Promise<void> {
    await this.state.openCv(entry.id);
    this.close();
  }

  /** Legt einen neuen Lebenslauf an und lässt ihn gleich benennen. */
  protected async create(): Promise<void> {
    await this.state.createCv(this.copy.ui().newCv);
    const id = this.activeId();
    if (id) {
      this.startRename({ id, name: '', updatedAt: '' });
    }
  }

  protected async duplicate(entry: CvLibraryEntry): Promise<void> {
    await this.state.duplicateCv(entry.id, `${entry.name} – ${this.copy.ui().copySuffix}`);
  }

  protected async remove(entry: CvLibraryEntry): Promise<void> {
    if (!confirm(this.copy.ui().confirmDeleteCv.replace('{name}', entry.name))) {
      return;
    }
    await this.state.deleteCv(entry.id);
  }

  protected startRename(entry: CvLibraryEntry): void {
    this.renaming.set(entry.id);
    // Nach dem Rendern Fokus ins Feld und Text markieren.
    setTimeout(() => {
      const input = this.renameInput()?.nativeElement;
      input?.focus();
      input?.select();
    });
  }

  protected async saveRename(entry: CvLibraryEntry): Promise<void> {
    const value = this.renameInput()?.nativeElement.value ?? '';
    this.renaming.set(null);
    if (value.trim() && value.trim() !== entry.name) {
      await this.state.renameCv(entry.id, value);
    }
  }
}
