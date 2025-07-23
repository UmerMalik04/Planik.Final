// Mock authentication service for demo purposes
// Replace this with real Supabase configuration when ready

interface User {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    gender?: string;
    date_of_birth?: string;
    avatar_url?: string;
  };
}

interface Session {
  user: User;
  access_token: string;
}

class MockSupabaseAuth {
  private session: Session | null = null;
  private users: Map<string, User> = new Map();
  private callbacks: ((event: string, session: Session | null) => void)[] = [];

  constructor() {
    // Check for existing session in localStorage
    const savedSession = localStorage.getItem('mock-auth-session');
    if (savedSession) {
      this.session = JSON.parse(savedSession);
    }
  }

  async signUp({ email, password, options }: any) {
    console.log('Mock signup for:', email);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (this.users.has(email)) {
      return { 
        data: null, 
        error: { message: 'User already registered' } 
      };
    }

    const user: User = {
      id: Date.now().toString(),
      email,
      user_metadata: options?.data || {}
    };

    this.users.set(email, user);
    localStorage.setItem('mock-users', JSON.stringify(Array.from(this.users.entries())));

    // For demo purposes, auto-verify the user
    this.session = {
      user,
      access_token: 'mock-token-' + Date.now()
    };

    localStorage.setItem('mock-auth-session', JSON.stringify(this.session));
    
    // Notify callbacks
    this.callbacks.forEach(callback => callback('SIGNED_IN', this.session));

    return { 
      data: { 
        user, 
        session: this.session 
      }, 
      error: null 
    };
  }

  async signInWithPassword({ email, password }: any) {
    console.log('Mock login for:', email);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Load users from localStorage
    const savedUsers = localStorage.getItem('mock-users');
    if (savedUsers) {
      const usersArray = JSON.parse(savedUsers);
      this.users = new Map(usersArray);
    }

    const user = this.users.get(email);
    if (!user) {
      return { 
        data: null, 
        error: { message: 'Invalid login credentials' } 
      };
    }

    this.session = {
      user,
      access_token: 'mock-token-' + Date.now()
    };

    localStorage.setItem('mock-auth-session', JSON.stringify(this.session));
    
    // Notify callbacks
    this.callbacks.forEach(callback => callback('SIGNED_IN', this.session));

    return { 
      data: { 
        user, 
        session: this.session 
      }, 
      error: null 
    };
  }

  async signInWithOAuth({ provider }: any) {
    console.log('Mock OAuth login with:', provider);
    
    // Simulate OAuth flow with realistic user data
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate retrieving user data from Google OAuth
    const userData = {
      id: 'google-' + Date.now(),
      email: 'john.doe@gmail.com',
      user_metadata: {
        name: 'John Doe',
        avatar_url: 'https://lh3.googleusercontent.com/a/ACg8ocJ8K9F7kL8mN2P4Q5R6S7T8U9V0W1X2Y3Z4-example=s96-c',
        provider: 'google',
        email_verified: true,
        phone_verified: false
      }
    };

    console.log('Retrieved user data from Google OAuth:', userData);

    this.session = {
      user: userData,
      access_token: 'mock-oauth-token-' + Date.now()
    };

    // Store user data in mock database
    this.users.set(userData.email, userData);
    localStorage.setItem('mock-users', JSON.stringify(Array.from(this.users.entries())));
    localStorage.setItem('mock-auth-session', JSON.stringify(this.session));
    
    // Notify callbacks
    this.callbacks.forEach(callback => callback('SIGNED_IN', this.session));

    return { 
      data: { 
        user: userData, 
        session: this.session 
      }, 
      error: null 
    };
  }

  async signOut() {
    console.log('Mock signout');
    this.session = null;
    localStorage.removeItem('mock-auth-session');
    
    // Notify callbacks
    this.callbacks.forEach(callback => callback('SIGNED_OUT', null));

    return { error: null };
  }

  async getSession() {
    return { 
      data: { 
        session: this.session 
      }, 
      error: null 
    };
  }

  async getUser() {
    return { 
      data: { 
        user: this.session?.user || null 
      }, 
      error: null 
    };
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    this.callbacks.push(callback);
    
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = this.callbacks.indexOf(callback);
            if (index > -1) {
              this.callbacks.splice(index, 1);
            }
          }
        }
      }
    };
  }

  // Mock methods that aren't used but might be called
  async verifyOtp() {
    return { data: { user: this.session?.user }, error: null };
  }

  async resend() {
    return { error: null };
  }
}

// Create mock Supabase client
export const supabase = {
  auth: new MockSupabaseAuth()
};