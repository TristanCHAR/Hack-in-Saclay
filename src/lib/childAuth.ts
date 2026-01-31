import bcrypt from 'bcryptjs';
import { supabase } from './supabase';

export interface Child {
    id: string;
    workspace_id: string;
    username: string;
    password_hash: string;
    name: string;
    birth_date: string | null;
    avatar_config: any;
    created_at: string;
    updated_at: string;
}

export interface ChildWithWorkspace extends Child {
    workspaces: {
        id: string;
        name: string;
        invite_code: string;
    };
}

/**
 * Hash a password for storage
 */
export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

/**
 * Verify a password against a hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

/**
 * Sign in a child with username and password
 */
export const signInChild = async (
    username: string,
    password: string
): Promise<ChildWithWorkspace | null> => {
    try {
        // Find child by username
        const { data: child, error } = await supabase
            .from('children')
            .select(`
        *,
        workspaces (
          id,
          name,
          invite_code
        )
      `)
            .eq('username', username)
            .single();

        if (error || !child) {
            console.error('Child not found:', error);
            return null;
        }

        // Verify password
        const isValid = await verifyPassword(password, child.password_hash);
        if (!isValid) {
            console.error('Invalid password');
            return null;
        }

        return child as ChildWithWorkspace;
    } catch (err) {
        console.error('Error signing in child:', err);
        return null;
    }
};

/**
 * Create a new child with username/password
 */
export const createChild = async (params: {
    workspace_id: string;
    username: string;
    password: string;
    name: string;
    birth_date?: string;
    avatar_config?: any;
}): Promise<Child | null> => {
    try {
        const password_hash = await hashPassword(params.password);

        const { data, error } = await supabase
            .from('children')
            .insert({
                workspace_id: params.workspace_id,
                username: params.username,
                password_hash,
                name: params.name,
                birth_date: params.birth_date || null,
                avatar_config: params.avatar_config || {},
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating child:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('Error in createChild:', err);
        return null;
    }
};

/**
 * Update child password
 */
export const updateChildPassword = async (
    childId: string,
    newPassword: string
): Promise<boolean> => {
    try {
        const password_hash = await hashPassword(newPassword);

        const { error } = await supabase
            .from('children')
            .update({ password_hash })
            .eq('id', childId);

        if (error) {
            console.error('Error updating password:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Error in updateChildPassword:', err);
        return false;
    }
};
