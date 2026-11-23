"use client";

import {
  startTransition,
  useEffect,
  useId,
  useOptimistic,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { addTag, removeTag, type TagResult } from "@/app/saves/[id]/actions";
import { Alert } from "@/components/Alert/Alert";
import { Button } from "@/components/Button/Button";
import { TagChip } from "@/components/TagChip/TagChip";
import { TextInput } from "@/components/TextInput/TextInput";
import { NO_TAGS } from "@/lib/saves/saves-text";
import {
  matchingTags,
  mostUsedTags,
  tagKey,
  tagNameError,
  type UserTag,
} from "@/lib/tags";
import {
  ALL_TAGS,
  MATCHING_TAGS,
  matchingTagsText,
  MOST_USED_TAGS,
  showAllTagsText,
  TAG_SAVE_FAILED,
} from "@/lib/tags-text";
import { applyTagChange, isSaving } from "./tag-change";
import styles from "./TagEditor.module.scss";

type Tag = { id: string; name: string };

/**
 * Calls a Server Function that answers with a result. A lost connection
 * makes the call itself throw, which would replace the whole page with the
 * error page, so it becomes the usual message instead.
 *
 * @param call - The Server Function call.
 * @returns Its result, or the message for a failed save.
 */
async function saveTag(call: () => Promise<TagResult>): Promise<TagResult> {
  try {
    return await call();
  } catch {
    return { ok: false, error: TAG_SAVE_FAILED };
  }
}

type Props = {
  /** The save whose tags are edited. */
  postId: string;
  /** Its tags, in alphabetical order. */
  tags: Tag[];
  /** All the user's tags with their counts, in alphabetical order. */
  userTags: UserTag[];
};

/**
 * A save's tags, with a × on each to remove it, a field to add one, and
 * the user's other tags below the field to add with one tap: the most used
 * ones (or all of them, on request) until something is typed, then the
 * ones matching it.
 *
 * Changes show at once and are saved on the server in the background,
 * which then sends the saved tags. If a save fails, the tags go back to
 * how they were and a message says so.
 *
 * @param props - The save, its tags, and all the user's tags.
 * @returns The tags and the form.
 */
export function TagEditor({ postId, tags, userTags }: Props) {
  const [shownTags, showChange] = useOptimistic(tags, applyTagChange);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string>();
  const [error, setError] = useState<string>();
  const [showAll, setShowAll] = useState(false);
  const offeredId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Where the last removed tag was, so focus can move to its neighbour
  // instead of getting lost with the removed button.
  const removedAt = useRef<number | null>(null);

  useEffect(() => {
    if (removedAt.current === null) return;
    const buttons = listRef.current?.querySelectorAll("button") ?? [];
    const neighbour = buttons[Math.min(removedAt.current, buttons.length - 1)];
    (neighbour ?? inputRef.current)?.focus();
    removedAt.current = null;
  }, [shownTags]);

  // The user's other tags, offered below the field.
  const onSave = shownTags.map((tag) => tag.name);
  const taken = new Set(onSave.map(tagKey));
  const available = userTags
    .map((tag) => tag.name)
    .filter((tagName) => !taken.has(tagKey(tagName)));
  const mostUsed = mostUsedTags(userTags, onSave);
  const typing = name.trim() !== "";
  const matches = matchingTags(available, name, onSave);
  const offered = typing ? matches : showAll ? available : mostUsed;
  const offeredTitle = typing
    ? MATCHING_TAGS
    : showAll
      ? ALL_TAGS
      : MOST_USED_TAGS;
  const canShowAll = !typing && available.length > mostUsed.length;

  /**
   * Shows the tag on the save at once, clears the field and puts focus in
   * it (a tapped tag's button goes away), then saves it. If that fails,
   * the tag disappears again and a typed name comes back in the field.
   *
   * @param tagName - The name typed, or the tag tapped.
   */
  function add(tagName: string) {
    setError(undefined);
    setName("");
    inputRef.current?.focus();
    startTransition(async () => {
      showChange({ type: "add", name: tagName });
      const result = await saveTag(() => addTag(postId, tagName));
      if (!result.ok) {
        setError(result.error);
        setName((current) => current || tagName);
      }
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const invalid = tagNameError(name);
    setNameError(invalid);
    if (!invalid) add(name);
  }

  function handleRemove(tag: Tag, index: number) {
    setError(undefined);
    removedAt.current = index;
    startTransition(async () => {
      showChange({ type: "remove", id: tag.id });
      const result = await saveTag(() => removeTag(postId, tag.id));
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className={styles.editor}>
      {shownTags.length > 0 ? (
        <ul ref={listRef} className={styles.list}>
          {shownTags.map((tag, index) => (
            <li key={tag.id}>
              <TagChip
                label={tag.name}
                onRemove={() => handleRemove(tag, index)}
                // Can't be removed before the server has given it an id.
                busy={isSaving(tag)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.muted}>{NO_TAGS}</p>
      )}

      {error && (
        <Alert variant="error">
          <p>{error}</p>
        </Alert>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextInput
          ref={inputRef}
          label="Add a tag"
          // Stops the browser's own list of earlier entries covering the
          // tags offered below.
          autoComplete="off"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (nameError) setNameError(tagNameError(event.target.value));
          }}
          error={nameError}
          className={styles.field}
        />
        <Button type="submit" className={styles.add}>
          Add
        </Button>
      </form>

      {/* Always in the page, so screen readers announce the change. */}
      <p role="status" className={styles.hidden}>
        {typing ? matchingTagsText(matches.length) : ""}
      </p>
      {offered.length > 0 && (
        <div className={styles.offered}>
          <p id={offeredId} className={styles.offeredTitle}>
            {offeredTitle}
          </p>
          <ul className={styles.list} aria-labelledby={offeredId}>
            {offered.map((tagName) => (
              <li key={tagName}>
                <TagChip label={tagName} onAdd={() => add(tagName)} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {canShowAll && (
        <Button
          variant="text"
          aria-expanded={showAll}
          onClick={() => setShowAll(!showAll)}
          className={styles.toggle}
        >
          {showAll ? "Show fewer" : showAllTagsText(available.length)}
        </Button>
      )}
    </div>
  );
}
