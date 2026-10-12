/* ════════════════════════════════════════════════
   Scheme Finder — Account (Login / Register) UI
   Talks to the real backend auth API (state.js: registerAccount,
   loginAccount, logoutAccount, pullProfileFromBackend, pushProfileToBackend)
   so a profile survives across devices, not just this browser.
   ════════════════════════════════════════════════ */

let acctMode = 'login';

function toggleAccountMode(){
  acctMode = acctMode === 'login' ? 'register' : 'login';
  document.getElementById('acct-name-row').style.display = acctMode === 'register' ? 'block' : 'none';
  document.getElementById('acct-submit-btn').textContent = acctMode === 'register' ? 'Create Account' : 'Log In';
  document.getElementById('acct-toggle-btn').textContent = acctMode === 'register' ? 'Log in instead' : 'Create account instead';
  const msg = document.getElementById('acctMsg'); msg.textContent = '';
}

async function submitAccountForm(){
  const email = document.getElementById('acct-email').value.trim();
  const password = document.getElementById('acct-password').value;
  const msgEl = document.getElementById('acctMsg');
  msgEl.style.color = 'var(--rd)'; msgEl.textContent = '';

  if(!email || !password){ msgEl.textContent = 'Email and password are required.'; return; }

  try{
    let user;
    if(acctMode === 'register'){
      const name = document.getElementById('acct-name').value.trim() || U.name;
      if(!name){ msgEl.textContent = 'Name is required to create an account.'; return; }
      user = await registerAccount(name, email, password);
    } else {
      user = await loginAccount(email, password);
    }

    // If the account already has a saved profile, that's authoritative
    // (e.g. logging in on a new device). Otherwise, push this device's
    // current profile (if any) up so it's not lost on first login/signup.
    if(user.profile && user.profile.cat && user.profile.edu && user.profile.inc){
      replaceAccountProfile(user);
      profileSet = true;
    } else if(U.cat && U.edu && U.inc){
      await pushProfileToBackend();
    }
    saveProfileLocal();
    refreshProfileViews();restoreSavedEligibilityForm();updateAccountUI();
    document.getElementById('modal')?.classList.add('hidden');
    fetchMatch(U).then(()=>renderSchemes(currentSchFilter));

    msgEl.style.color = 'var(--gn)';
    msgEl.textContent = acctMode === 'register'
      ? 'Account created — your profile is now saved.'
      : 'Logged in — your saved profile has been loaded.';
  } catch(e){
    msgEl.style.color = 'var(--rd)';
    msgEl.textContent = e.message || 'Something went wrong — try again.';
  }
}

function doLogout(){
  logoutAccount();
  updateAccountUI();
}

// Lets a returning user on a new/cleared device skip past the "tell us
// about yourself" onboarding and go straight to logging into their
// existing account instead.
function goToLogin(){
  document.getElementById('modal').classList.add('hidden');
  goPanel('profile');
  if(acctMode !== 'login') toggleAccountMode();
  setTimeout(()=>document.getElementById('acct-email')?.focus(), 100);
}
