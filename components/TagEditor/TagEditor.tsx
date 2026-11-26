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
import {
  addTag,
  ignoreSuggestion,
  removeTag,
  type TagResult,
} from "@/app/saves/[id]/actions";
import { Alert } from "@/components/Alert/Alert";
import { Button } from "@/components/Button/Button";
import { TagChip } from "@/components/TagChip/TagChip";
import { TextInput } from "@/components/TextInput/TextInput";
import { Toast } from "@/components/Toast/Toast";
import { NO_TAGS } from "@/lib/saves/saves-text";
import type { TagSuggestions } from "@/lib/tag-suggestions";
import {
  matchingTags,
  mostUsedTags,
  tagFieldError,
  tagKey,
  type UserTag,
} from "@/lib/tags";
import {
  ALL_TAGS,
  COLLECTION_SUGGESTIONS,
  creatorSuggestionsText,
  MATCHING_TAGS,
  matchingTagsText,
  MOST_USED_TAGS,
  removedTagText,
  showAllTagsText,
  SUGGESTION_IGNORE_FAILED,
  TAG_SAVE_FAILED,
  UNDO,
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
 * @param failed - The message if the call throws.
 * @returns Its result, or the message.
 */
async function saveTag(
  call: () => Promise<TagResult>,
  failed = TAG_SAVE_FAILED,
): Promise<TagResult> {
  try {
    return await call();
  } catch {
    return { ok: false, error: failed };
  }
}

type Props = {
  /** The save whose tags are edited. */
  postId: string;
  /** Its tags, in alphabetical order. */
  tags: Tag[];
  /** All the user's tags with their counts, in alphabetical order. */
  userTags: UserTag[];
  /** Tags suggested for the save, and the creator they're partly from. */
  suggestions: TagSuggestions & { creatorUsername: string };
  /** Names of the collections the save is in, which may be long tags. */
  collections: string[];
};

/**
 * A save's tags, with a × on each to remove it, a field to add one, and
 * tags below the field to add with one tap. Until something is typed, those
 * are the suggestions for the save, each with a × to stop suggesting it
 * there, then the user's most used other tags (or all of them, on request);
 * once something is typed, the user's tags matching it.
 *
 * Changes show at once and are saved on the server in the background,
 * which then sends the saved tags. If a save fails, the tags go back to
 * how they were and a message says so. A removal can be undone from a
 * message at the bottom of the screen until the next change.
 *
 * @param props - The save, its tags and collections, all the user's tags,
 *   and suggestions.
 * @returns The tags and the form.
 */
export function TagEditor({
  postId,
  tags,
  userTags,
  suggestions,
  collections,
}: Props) {
  const [shownTags, showChange] = useOptimistic(tags, applyTagChange);
  // Keys of suggestions hidden while the server remembers it; the server
  // then sends suggestions without them.
  const [hidden, hide] = useOptimistic<string[], string>([], (keys, key) => [
    ...keys,
    key,
  ]);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string>();
  const [error, setError] = useState<string>();
  const [showAll, setShowAll] = useState(false);
  // The last tag removed, offered back by the toast until the next change.
  const [removed, setRemoved] = useState<string>();
  const offeredId = useId();
  const creatorId = useId();
  const collectionsId = useId();
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
  const typing = name.trim() !== "";
  // Left out once added or hidden, before the server has sent new ones.
  const suggest = (names: string[]) =>
    typing
      ? []
      : names.filter(
          (tagName) =>
            !taken.has(tagKey(tagName)) && !hidden.includes(tagKey(tagName)),
        );
  const fromCreator = suggest(suggestions.fromCreator);
  const fromCollections = suggest(suggestions.fromCollections);
  // Most used doesn't repeat what's suggested above it.
  const mostUsed = mostUsedTags(userTags, [
    ...onSave,
    ...fromCreator,
    ...fromCollections,
  ]);
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
   * it (a tapped tag's or Undo's button goes away), then saves it. If that
   * fails, the tag disappears again, and it comes back where it came from
   * so it can be tried again: a typed name in the field, an undo in the
   * toast. A tapped tag is offered again by itself.
   *
   * @param tagName - The name typed, the tag tapped, or the tag to undo.
   * @param from - Where the tag came from.
   */
  function add(tagName: string, from: "field" | "offered" | "undo") {
    setError(undefined);
    setRemoved(undefined);
    setName("");
    inputRef.current?.focus();
    startTransition(async () => {
      showChange({ type: "add", name: tagName });
      const result = await saveTag(() => addTag(postId, tagName));
      if (!result.ok) {
        setError(result.error);
        if (from === "field") setName((current) => current || tagName);
        // Unless a later removal has taken the toast meanwhile.
        if (from === "undo") setRemoved((current) => current ?? tagName);
      }
    });
  }

  /**
   * Stops suggesting a tag on this save: it goes away at once, and focus
   * moves to the field as its button goes too. If remembering it fails,
   * it comes back with a message.
   *
   * @param tagName - The suggested tag.
   */
  function ignore(tagName: string) {
    setError(undefined);
    inputRef.current?.focus();
    startTransition(async () => {
      hide(tagKey(tagName));
      const result = await saveTag(
        () => ignoreSuggestion(postId, tagName),
        SUGGESTION_IGNORE_FAILED,
      );
      if (!result.ok) setError(result.error);
    });
  }

  /**
   * One group of suggestions, under a title saying where they come from.
   *
   * @param id - The title's id, which names the list.
   * @param title - Where the suggestions come from.
   * @param names - The suggested tags; no group when there are none.
   * @returns The group, or nothing.
   */
  function suggestionGroup(id: string, title: string, names: string[]) {
    if (names.length === 0) return null;
    return (
      <div className={styles.offered}>
        <p id={id} className={styles.offeredTitle}>
          {title}
        </p>
        <ul className={styles.list} aria-labelledby={id}>
          {names.map((tagName) => (
            <li key={tagName}>
              <TagChip
                label={tagName}
                onAdd={() => add(tagName, "offered")}
                onIgnore={() => ignore(tagName)}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const invalid = tagFieldError(name, userTags, collections);
    setNameError(invalid);
    if (!invalid) add(name, "field");
  }

  function handleRemove(tag: Tag, index: number) {
    setError(undefined);
    setRemoved(tag.name);
    removedAt.current = index;
    startTransition(async () => {
      showChange({ type: "remove", id: tag.id });
      const result = await saveTag(() => removeTag(postId, tag.id));
      if (!result.ok) {
        // Only this removal's toast: a later one may have replaced it.
        setRemoved((current) => (current === tag.name ? undefined : current));
        setError(result.error);
      }
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
            if (nameError)
              setNameError(
                tagFieldError(event.target.value, userTags, collections),
              );
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
      {suggestionGroup(
        creatorId,
        creatorSuggestionsText(suggestions.creatorUsername),
        fromCreator,
      )}
      {suggestionGroup(collectionsId, COLLECTION_SUGGESTIONS, fromCollections)}
      {offered.length > 0 && (
        <div className={styles.offered}>
          <p id={offeredId} className={styles.offeredTitle}>
            {offeredTitle}
          </p>
          <ul className={styles.list} aria-labelledby={offeredId}>
            {offered.map((tagName) => (
              <li key={tagName}>
                <TagChip
                  label={tagName}
                  onAdd={() => add(tagName, "offered")}
                />
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

      <Toast
        message={removed && removedTagText(removed)}
        action={
          removed
            ? { label: UNDO, onClick: () => add(removed, "undo") }
            : undefined
        }
        onDismiss={() => {
          setRemoved(undefined);
          // The × goes away with the toast; the field is where tagging goes on.
          inputRef.current?.focus();
        }}
      />
    </div>
  );
}
