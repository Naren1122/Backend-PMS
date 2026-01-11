// this code helps to handle async errors which means if any error occur it will go to next middleware.
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    console.log('[asyncHandler] Executing handler for:', req.method, req.path);
    console.log('[asyncHandler] next is function?', typeof next === 'function');
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      console.error('[asyncHandler] Error caught:', err.message);
      console.error('[asyncHandler] Error stack:', err.stack);
      next(err);
    });
  };
};
export { asyncHandler };
