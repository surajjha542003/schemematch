/* Only source-reviewed metadata may be presented as official facts. */
const SourcePolicy = require('../data/shared')('source-policy');
function enrichScheme(scheme) {
  const deadline=scheme.deadlineVerified ? scheme.deadline || null : null;
  return {
    department:scheme.department || scheme.by || null,
    academicYear:scheme.academicYear || null,
    status:scheme.status || 'unknown',
    documents:scheme.documentsVerified && Array.isArray(scheme.documents) ? scheme.documents : [],
    documentsNote:scheme.documentsNote || 'Exact programme-specific document list not verified.',
    applicationUrl:SourcePolicy.applicationUrl(scheme),
    registrationUrl:SourcePolicy.officialUrl(scheme.registrationUrl),
    applicationActions:SourcePolicy.applicationActions(scheme),
    governmentSource:scheme.source || null,
    lastVerified:scheme.sourceChecked || null,
    lastChecked:scheme.sourceChecked || null,
    deadline, deadlineConfidence:deadline ? 'official-published-window' : null,
    timeline:deadline ? `${scheme.applicationRoute === 'renewal' ? 'Renewal' : 'Published student'} window closes ${deadline}; see current official notice.` : 'Current deadline unconfirmed; check the official notice.',
    daysRemaining:deadline ? Math.ceil((Date.parse(deadline+'T23:59:59+05:30')-Date.now())/86400000) : null,
  };
}
function enrichSchemeList(schemes) { return schemes.map(s=>({...s,...enrichScheme(s)})); }
module.exports={enrichScheme,enrichSchemeList};
