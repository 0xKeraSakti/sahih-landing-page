/**
 * Turns a nav label into its section anchor. Shared by the hero nav and the
 * footer so both link to the same fragment for a given label.
 */
export const slugify = (label: string) => label.toLowerCase().replace(/[^a-z]+/g, '-')
