// File-specific codemod for PreferencesPage.tsx, where the auth-store object
// (originally `user`) and the local profile *form* state (originally `profile`)
// would otherwise collide once `user` -> `profile`. We map the auth object to
// `authProfile`, the store field accesses (`s.user`) to `s.profile`, and leave
// the form variable `profile` untouched.
import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../src/pages/dashboard/PreferencesPage.tsx', import.meta.url).pathname;
let src = readFileSync(file, 'utf8');

const apply = (re, rep) => { src = src.replace(re, rep); };

// 1. wire/domain id field first (object keys like `userId:`)
apply(/\buserId\b/g, 'profileId');
// 2. store-state field accesses
apply(/\bs\.user\b/g, 's.profile');
apply(/\bstate\.user\b/g, 'state.profile');
// 3. setState object-literal store keys (now `user: s.profile`) -> `profile:`
apply(/\buser:/g, 'profile:');
// 4. the destructure must read the renamed store field `profile`
apply(/const\s*\{\s*user\s*\}\s*=\s*useAuthStore\(\)/g, 'const { profile: authProfile } = useAuthStore()');
// 5. remaining bare auth-object usages -> authProfile (never the Supabase session)
apply(/(?<!session\.)(?<!session\?\.)\buser\b/g, 'authProfile');
// 6. other domain tokens (form `profile` and `authProfile` are unaffected)
apply(/\bUserPreferences\b/g, 'ProfilePreferences');
apply(/\bUserRole\b/g, 'ProfileRole');
apply(/\busername\b/g, 'profileHandle');
apply(/\bUser\b/g, 'Profile');
apply(/\busers\b/g, 'profiles');

writeFileSync(file, src);
console.log('PreferencesPage transformed.');
