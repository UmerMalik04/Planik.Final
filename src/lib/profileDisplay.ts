type Metadata = Record<string, unknown> | null | undefined;

export interface ProfileIdentity {
  identity_data?: Record<string, unknown> | null;
}

export interface ProfileDisplayUser {
  email?: string | null;
  user_metadata?: Metadata;
  identities?: ProfileIdentity[] | null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function fromSources(user: ProfileDisplayUser, keys: string[]): string | undefined {
  const sources = [
    user.user_metadata,
    ...(user.identities ?? []).map(identity => identity.identity_data),
  ];

  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const value = asString(source[key]);
      if (value) return value;
    }
  }

  return undefined;
}

export function getProviderDisplayName(user: ProfileDisplayUser): string | undefined {
  const direct = fromSources(user, ['name', 'full_name', 'display_name', 'user_name']);
  if (direct) return direct;

  const firstName = fromSources(user, ['given_name', 'givenName', 'first_name']);
  const lastName = fromSources(user, ['family_name', 'familyName', 'last_name']);
  const combined = [firstName, lastName].filter(Boolean).join(' ').trim();
  return combined || undefined;
}

export function getProviderEmail(user: ProfileDisplayUser): string | undefined {
  return user.email?.trim() || fromSources(user, ['email', 'email_address']);
}

export function getProviderPhone(user: ProfileDisplayUser & { phone?: string | null }): string | undefined {
  return user.phone?.trim() || fromSources(user, ['phone', 'phone_number', 'phoneNumber']);
}

export function getProviderAvatarUrl(user: ProfileDisplayUser): string | undefined {
  return fromSources(user, ['avatar_url', 'picture', 'imageUrl']);
}

export function getDisplayInitial(nameOrEmail?: string | null): string {
  const cleaned = nameOrEmail?.trim();
  if (!cleaned) return '?';
  return cleaned.charAt(0).toUpperCase();
}

export function isGenericDisplayName(name?: string | null): boolean {
  const cleaned = name?.trim().toLowerCase();
  return !cleaned || cleaned === 'user';
}