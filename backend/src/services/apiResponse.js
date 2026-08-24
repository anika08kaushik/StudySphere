export const successResponse = (response, data = {}, message = 'Operation successful', status = 200) =>
  response.status(status).json({ success: true, message, data })

export const errorResponse = (response, message = 'Something went wrong', status = 500) =>
  response.status(status).json({ success: false, message })
