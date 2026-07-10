function success(res, data = null, message = 'Operation successful', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function created(res, data = null, message = 'Resource created successfully') {
  return success(res, data, message, 201);
}

function paginated(res, data, total, page, limit, message = 'Data retrieved successfully') {
  return res.status(200).json({
    success: true,
    message,
    data: {
      records: data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
}

function error(res, message = 'An error occurred', statusCode = 500, errors = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors })
  });
}

module.exports = { success, created, paginated, error };