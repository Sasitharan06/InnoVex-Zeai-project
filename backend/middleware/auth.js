const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://xtvzwmkfwxqxyyxarcql.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role,
      full_name: user.user_metadata?.full_name
    };
    
    console.log(`Auth success for ${req.user.email}, Role: ${req.user.role}`);
    
    // We will attach the token to the request so apiRoutes can use it to query Supabase
    req.token = token;

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Error validating token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      console.log(`Forbidden! User role: ${req.user?.role}, Required: ${roles}`);
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

module.exports = { requireAuth, requireRole, supabase };
