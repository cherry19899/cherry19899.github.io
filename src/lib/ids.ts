/**
 * Comparing Pi user ids.
 *
 * The server compares ids case- and `pi_`-insensitively everywhere
 * (`normalizeId` in every route file), because the same person's id is not
 * spelled the same way in every row: usernames come back from Pi with the
 * casing the user chose, the auth self-heal in routes/auth.js has renamed
 * accounts, and older rows keep whatever spelling was current when they were
 * written. The owner's own account is the standing proof — "Cherry19899" with
 * a capital C, against a `pi_cherry19899` written elsewhere.
 *
 * The UI was comparing with `===`, so wherever the two spellings differed the
 * app decided the user was a stranger to their own job, escrow or message:
 * the client saw the Apply button on a job they had posted, the participants
 * of an escrow saw none of its action buttons, and every message you had sent
 * rendered on the other person's side of the chat.
 */

/** The comparison key for a user id — never store this, only compare with it. */
export const normalizeId = (id?: string | null): string =>
  (id || '').toString().toLowerCase().replace(/^pi_/, '');

/**
 * True when both ids name the same person.
 *
 * Empty is never equal to empty: an absent id means "nobody", and two absent
 * ids matching would make a viewer with no session look like the participant
 * of an escrow that has no freelancer yet.
 */
export const sameUser = (a?: string | null, b?: string | null): boolean => {
  const x = normalizeId(a);
  const y = normalizeId(b);
  return !!x && !!y && x === y;
};
