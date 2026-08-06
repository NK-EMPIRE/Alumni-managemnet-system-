/**
 * Utility service to extract clean designation, company, and city from raw strings
 * such as working_details or unstructured designation inputs.
 */

function cleanRoleAndCompany(designationRaw, companyRaw, workingDetailsRaw) {
  let designation = (designationRaw || '').trim();
  let company = (companyRaw || '').trim();
  let workingDetails = (workingDetailsRaw || '').trim();

  // If designation or company is empty, try to parse from workingDetails
  if ((!designation || !company) && workingDetails) {
    // Pattern: "Role - Company City" e.g., "HR - IDFC bank Trichy"
    const dashMatch = workingDetails.match(/^([^-]+)\s*-\s*(.+)$/i);
    if (dashMatch) {
      if (!designation) designation = dashMatch[1].trim();
      if (!company) company = dashMatch[2].trim();
    } else {
      // Pattern: "working in [Company]"
      const inMatch = workingDetails.match(/(?:working\s+in|at)\s+([^,.]+)/i);
      if (inMatch && !company) {
        company = inMatch[1].trim();
      }
      if (!designation) {
        designation = workingDetails;
      }
    }
  }

  // Handle Academic / Educational Roles:
  // e.g. Designation = "Assistant Professor at MZCET" -> Designation = "Assistant Professor", Company = "MZCET"
  if (designation) {
    const academicMatch = designation.match(/^(Assistant Professor|Associate Professor|Professor|HOD|Head of Dept|Dean|Lecturer|Teacher|Principal|Correspondent)\s+(?:at|in|of|-)\s+(.+)$/i);
    if (academicMatch) {
      designation = academicMatch[1].trim();
      if (!company || company === 'null') {
        company = academicMatch[2].trim();
      }
    }
  }

  return { designation, company };
}

module.exports = {
  cleanRoleAndCompany
};
