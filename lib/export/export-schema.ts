import { z } from "zod";

// Instagram's export describes every post as a list of labelled fields
// instead of fixed keys. Groups like "Owner" or "Hashtags" nest more lists.
// Unknown keys are allowed, so a new field from Meta doesn't break imports.

/** One labelled field, or a titled group of nested fields. */
export type Field = {
  label?: string;
  value?: string;
  href?: string;
  timestamp_value?: number;
  title?: string;
  dict?: Group[];
};

/** One item inside a group, holding its own fields. */
export type Group = { title?: string; dict?: Field[] };

export const fieldSchema: z.ZodType<Field> = z.looseObject({
  label: z.string().optional(),
  value: z.string().optional(),
  href: z.string().optional(),
  timestamp_value: z.number().optional(),
  title: z.string().optional(),
  get dict() {
    return z.array(groupSchema).optional();
  },
});

export const groupSchema: z.ZodType<Group> = z.looseObject({
  title: z.string().optional(),
  get dict() {
    return z.array(fieldSchema).optional();
  },
});

/** One saved post in saved_posts.json, or one collection. */
export const entrySchema = z.looseObject({
  timestamp: z.number().optional(),
  fbid: z.string().optional(),
  label_values: z.array(fieldSchema),
});

/** Both files are a plain list of entries; anything else isn't an export. */
export const fileSchema = z.array(z.unknown());
