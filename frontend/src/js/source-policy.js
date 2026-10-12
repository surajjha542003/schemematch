/* Shared URL boundary. Government ownership is not a review of programme rules. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SourcePolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const exceptions = new Set(['harchhatravratti.highereduhry.ac.in']);
  // Provider forms are allowed only at paths linked by the government programme.
  const providerForms = {
    'my.ebharatgas.com': ['/bharatgas/LPGServices/ApplyUjjwala2Connection', '/bharatgas/LPGServices/ApplyNewEPMUY3Connection'],
    'myhpgas.in': ['/myHPGas/NewConsumerRegistration.aspx'],
    'cx.indianoil.in': ['/webcenter/portal/Customer/pages_landingpage'],
    'umisdashboard.tnega.org': ['/auth/login'],
    'labour.upbocw.in': ['/worker/scheme/sant-ravidas-shiksha'],
    'www.mudra.org.in': ['/Default/DownloadFile/Common_loan_Application_form.pdf', '/Default/DownloadFile/Application_Form_for_Shishu.pdf'],
  };
  function officialUrl(value) {
    try {
      const u = new URL(value);
      const h = u.hostname.toLowerCase();
      if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) return null;
      if (providerForms[h] && u.search) return null;
      return (h.endsWith('.gov.in') || h.endsWith('.nic.in') || exceptions.has(h) || providerForms[h]?.includes(u.pathname)) ? u.href : null;
    } catch (_) { return null; }
  }
  // Only an explicit application route can be normalised. Information/source
  // URLs must stay intact, and a state programme never inherits an NSP default.
  const nspApplicationUrl = 'https://scholarships.gov.in/ApplicationForm/';
  // The current OTR router mounts RegistrationComponent at its empty path.
  // /registration-page lacks server rewrites; use this supported form entry.
  const nspRegistrationUrl = 'https://scholarships.gov.in/otrapplication/';
  const nspApplicationNote = 'Use Application login, sign in to NSP, then select this scholarship. NSP opens the individual application form after sign-in. New applicants must first complete OTR registration.';
  const blockedEntries = new Set([
    'umis.tn.gov.in/', 'mahadbt2.maharashtra.gov.in/', 'svmcm.wb.gov.in/',
    'scholarship.rajasthan.gov.in/', 'www.digitalgujarat.gov.in/', 'digitalgujarat.gov.in/',
    'scholarship.odisha.gov.in/', 'egrantz.kerala.gov.in/', 'jnanabhumi.ap.gov.in/',
    'harchhatravratti.highereduhry.ac.in/', 'ekalyan.cgg.gov.in/',
    'postmatric-scholarship.cg.nic.in/', 'scholarship.up.gov.in/',
    'directorateofhighereducation.assam.gov.in/portlets/scholarships',
    'pmkisan.gov.in/', 'pmfby.gov.in/', 'pmvishwakarma.gov.in/', 'pmuy.gov.in/', 'pmay-urban.gov.in/',
  ]);
  function applicationUrl(scheme) {
    if (['closed','institution','unavailable'].includes(scheme?.applicationAccess)) return null;
    const url = officialUrl(scheme?.applicationUrl);
    if (!url) return null;
    const u = new URL(url);
    if (u.hostname === 'scholarships.gov.in' && /^\/(?:All-Scholarships|home|Students)?\/?$/i.test(u.pathname)) return nspApplicationUrl;
    if (blockedEntries.has(u.hostname + u.pathname)) return null;
    return url;
  }
  function registrationUrl(scheme) {
    return applicationActions(scheme).links[0]?.url || null;
  }
  function applicationActions(scheme) {
    const type = scheme?.applicationAccess;
    const labels = { form:'Open application form', registration:'Registration form', login:'Application login', download:'Download application form' };
    const links = [];
    if (!['closed','institution','unavailable'].includes(type)) {
      const registration = applicationUrl({applicationUrl:scheme?.registrationUrl});
      const application = applicationUrl(scheme);
      const nsp=application===nspApplicationUrl;
      if (nsp) links.push({url:application,label:'Application login'});
      if (registration) links.push({url:registration,label:nsp?'OTR registration form':'Registration form'});
      if (!nsp && application && application !== registration) links.push({url:application,label:labels[type] || 'Application login'});
      for (const option of scheme?.applicationOptions || []) {
        const url = officialUrl(option.url);
        if (url) links.push({url,label:option.label});
      }
    }
    const actions = { links, note:scheme?.applicationNote || (!links.length ? 'A public application form link has not been confirmed for this programme.' : '') };
    // Search is a separate, generated action; it never becomes a verified form
    // or the registrationUrl used by application and tracker workflows.
    if (type === 'unavailable' && !links.length && scheme?.name) {
      const query = `${scheme.name} ${scheme.state || 'India'} application form registration (site:gov.in OR site:nic.in)`;
      actions.search = {url:`https://www.google.com/search?q=${encodeURIComponent(query)}`,label:'Search official application forms'};
    }
    return actions;
  }
  return { officialUrl, applicationUrl, registrationUrl, applicationActions, nspApplicationUrl, nspRegistrationUrl, nspApplicationNote };
});
