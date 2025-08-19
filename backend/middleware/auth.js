const jwt = require('jsonwebtoken');

// Express middleware: verifies JWT from Authorization header and optionally enforces roles
// Usage: app.get('/secure', auth(['ADMIN','DRIVER']), handler)
function auth(requiredRoles) {
	return (req, res, next) => {
		try {
			console.log('🔐 Auth middleware - Checking authorization...');
			console.log('📋 Required roles:', requiredRoles);
			
			const authHeader = req.header('Authorization') || '';
			console.log('📨 Auth header:', authHeader.substring(0, 50) + '...');
			
			const match = authHeader.match(/^Bearer\s+(.+)$/i);
			if (!match) {
				console.log('❌ No Bearer token found');
				return res.status(401).json({ ok: false, code: 'NO_TOKEN', message: 'Authorization token missing' });
			}
			
			const token = match[1];
			console.log('🔑 Token extracted:', token.substring(0, 20) + '...');
			
			const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
			console.log('🔓 Token decoded:', decoded);
			
			const user = {
				_id: decoded.userId || decoded._id || decoded.id,
				role: decoded.role || decoded.userRole || 'PASSENGER',
				name: decoded.name,
				email: decoded.email,
			};
			
			console.log('👤 User object created:', user);
			req.user = user;
			
			if (Array.isArray(requiredRoles) && requiredRoles.length > 0) {
				console.log('🔍 Checking role requirements...');
				console.log('👤 User role:', user.role);
				console.log('📋 Required roles:', requiredRoles);
				
				if (!requiredRoles.includes(user.role)) {
					console.log('❌ Role check failed - insufficient permissions');
					return res.status(403).json({ ok: false, code: 'FORBIDDEN', message: 'Insufficient role' });
				}
				console.log('✅ Role check passed');
			}
			
			console.log('✅ Auth middleware - proceeding to route handler');
			return next();
		} catch (err) {
			console.error('❌ Auth middleware error:', err);
			return res.status(401).json({ ok: false, code: 'INVALID_TOKEN', message: 'Invalid or expired token' });
		}
	};
}

// Socket.IO middleware: verifies token from query
function wsAuth(socket, next) {
	try {
		const token = socket.handshake?.query?.token;
		if (!token) return next(new Error('NO_TOKEN'));
		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
		socket.user = {
			_id: decoded.userId || decoded._id || decoded.id,
			role: decoded.role || decoded.userRole || 'PASSENGER',
			name: decoded.name,
			email: decoded.email,
		};
		return next();
	} catch (err) {
		return next(new Error('INVALID_TOKEN'));
	}
}

module.exports = { auth, wsAuth };
