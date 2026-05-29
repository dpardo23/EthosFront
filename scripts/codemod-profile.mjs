// One-shot codemod: rename the "user" domain to "profile" across the frontend.
// Preserves identifiers that would break if renamed:
//   - React hook  : useRef               (auto-safe: no trailing word boundary)
//   - CSS props    : userSelect, user-select  (auto-safe: trailing word char)
//   - SVG attr     : userSpaceOnUse           (auto-safe: trailing word char)
//   - Supabase     : user_metadata, session.user, session?.user
//   - Lucide icons : Users, UserPlus, UserRound, UserCog, UserCircle2
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = new URL('../src/', import.meta.url).pathname;

// Ordered list of [RegExp, replacement]. Compound tokens first, bare last.
// All patterns are case-sensitive and word-boundaried so protected identifiers
// (Lucide `Users`/`UserPlus`, `user_metadata`, `userSelect`, `useRef`) never match.
const RULES = [
  // --- snake_case domain fields (mock + activity) -------------------------
  [/\buser_id\b/g, 'profile_id'],
  [/\buser_name\b/g, 'profile_name'],
  [/\buser_avatar\b/g, 'profile_avatar'],
  [/\buser_registered\b/g, 'profile_registered'],
  // NOTE: user_metadata intentionally absent -> preserved (Supabase contract)

  // --- compound camelCase / PascalCase identifiers ------------------------
  [/\bmapUserTypeToRole\b/g, 'mapProfileTypeToRole'],
  [/\bbuildUserFromSupabase\b/g, 'buildProfileFromSupabase'],
  [/\bbuildUserFromToken\b/g, 'buildProfileFromToken'],
  [/\bgetCurrentUser\b/g, 'getCurrentProfile'],
  [/\bfindMockUser\b/g, 'findMockProfile'],
  [/\bhandleSelectUser\b/g, 'handleSelectProfile'],
  [/\bsetShowUserMenu\b/g, 'setShowProfileMenu'],
  [/\bshowUserMenu\b/g, 'showProfileMenu'],
  [/\buserMenuRef\b/g, 'profileMenuRef'],
  [/\buserPreferencesData\b/g, 'profilePreferencesData'],
  [/\bmockUserPreferences\b/g, 'mockProfilePreferences'],
  [/\bUserPreferences\b/g, 'ProfilePreferences'],
  [/\bUserRole\b/g, 'ProfileRole'],
  [/\bUserData\b/g, 'ProfileData'],
  [/\brecruiterTalentUsers\b/g, 'recruiterTalentProfileList'],
  [/\bsetSelectedUsers\b/g, 'setSelectedProfiles'],
  [/\bsetSelectedUser\b/g, 'setSelectedProfile'],
  [/\bselectedUsers\b/g, 'selectedProfiles'],
  [/\bselectedUser\b/g, 'selectedProfile'],
  [/\bpaginatedUsers\b/g, 'paginatedProfiles'],
  [/\bfilteredUsers\b/g, 'filteredProfiles'],
  [/\brecruiterTalentUsers\b/g, 'recruiterTalentProfileList'],
  [/\bmockUsers\b/g, 'mockProfiles'],
  [/\bMOCK_USERS\b/g, 'MOCK_PROFILES'],
  [/\bmockUser\b/g, 'mockProfile'],
  [/\bsbUser\b/g, 'sbProfile'],
  [/\bsyncUser\b/g, 'syncProfile'],
  [/\bupdatedUser\b/g, 'updatedProfile'],
  [/\ballUsers\b/g, 'allProfiles'],
  [/\bbaseUsers\b/g, 'baseProfiles'],
  [/\bsetUsers\b/g, 'setProfiles'],
  [/\btotalUsers\b/g, 'totalProfiles'],
  [/\bactiveUsers\b/g, 'activeProfiles'],
  [/\binactiveUsers\b/g, 'inactiveProfiles'],
  [/\buserGrowth\b/g, 'profileGrowth'],
  [/\buserType\b/g, 'profileType'],
  [/\buserSlug\b/g, 'profileSlug'],
  [/\buserName\b/g, 'profileHandle'],
  [/\busername\b/g, 'profileHandle'],
  [/\bUsername\b/g, 'ProfileHandle'],
  [/\bAdminUsersPage\b/g, 'AdminProfilesPage'],
  [/\bethoshub_user\b/g, 'ethoshub_profile'],
  [/\b_userId\b/g, '_profileId'],
  [/\buserId\b/g, 'profileId'],
  [/\bUSERS\b/g, 'PROFILES'],

  // --- bare identifiers (LAST) -------------------------------------------
  [/\busers\b/g, 'profiles'],
  [/\bUser\b/g, 'Profile'],
  // bare `user`, but never the Supabase session object property
  [/(?<!session\.)(?<!session\?\.)\buser\b/g, 'profile'],
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (['.ts', '.tsx'].includes(extname(full))) out.push(full);
  }
  return out;
}

let changedFiles = 0;
let totalSubs = 0;
for (const file of walk(ROOT)) {
  const before = readFileSync(file, 'utf8');
  let after = before;
  for (const [re, rep] of RULES) after = after.replace(re, rep);
  if (after !== before) {
    writeFileSync(file, after);
    changedFiles++;
    const subs = before.split('').length; // placeholder, real count below
    totalSubs += subs ? 0 : 0;
    console.log('  modified', file.replace(ROOT, 'src/'));
  }
}
console.log(`\nDone. ${changedFiles} files modified.`);
