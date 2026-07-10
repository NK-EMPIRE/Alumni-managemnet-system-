function getPaginationParams(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100;

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

function getSortParams(query, allowedColumns = []) {
  let sortBy = query.sortBy || 'created_at';
  let sortOrder = (query.sortOrder || 'DESC').toUpperCase();

  if (allowedColumns.length > 0 && !allowedColumns.includes(sortBy)) {
    sortBy = 'created_at';
  }

  if (sortOrder !== 'ASC' && sortOrder !== 'DESC') {
    sortOrder = 'DESC';
  }

  return { sortBy, sortOrder };
}

module.exports = { getPaginationParams, getSortParams };