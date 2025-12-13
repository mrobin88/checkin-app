import { supabase } from './supabase';
import { FriendRequest, User, UserProfile } from '../types';
import { createNotification } from './notifications';

// Send friend request
export async function sendFriendRequest(fromUserId: string, toUserId: string, fromUsername: string, fromAvatarUrl?: string): Promise<{ success: boolean; error?: string }> {
  // Check if already friends
  const { data: existingFriendship } = await supabase
    .from('friendships')
    .select('id')
    .or(`and(user_id.eq.${fromUserId},friend_id.eq.${toUserId}),and(user_id.eq.${toUserId},friend_id.eq.${fromUserId})`)
    .single();
    
  if (existingFriendship) {
    return { success: false, error: 'Already friends' };
  }
  
  // Check if request already exists
  const { data: existingRequest } = await supabase
    .from('friend_requests')
    .select('id, status')
    .or(`and(from_user_id.eq.${fromUserId},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${fromUserId})`)
    .eq('status', 'pending')
    .single();
    
  if (existingRequest) {
    return { success: false, error: 'Request already pending' };
  }
  
  // Create friend request
  const { error } = await supabase
    .from('friend_requests')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      status: 'pending',
    });
    
  if (error) {
    console.error('Error sending friend request:', error);
    return { success: false, error: error.message };
  }
  
  // Create notification for recipient
  await createNotification({
    user_id: toUserId,
    from_user_id: fromUserId,
    from_username: fromUsername,
    from_avatar_url: fromAvatarUrl,
    notification_type: 'friend_request',
    content: `${fromUsername} wants to be your friend!`,
  });
  
  return { success: true };
}

// Accept friend request
export async function acceptFriendRequest(requestId: string, userId: string, fromUserId: string, username: string, avatarUrl?: string): Promise<{ success: boolean; error?: string }> {
  // Update request status
  const { error: updateError } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('to_user_id', userId);
    
  if (updateError) {
    console.error('Error accepting friend request:', updateError);
    return { success: false, error: updateError.message };
  }
  
  // Create bidirectional friendship
  const { error: friendshipError } = await supabase
    .from('friendships')
    .insert([
      { user_id: userId, friend_id: fromUserId },
      { user_id: fromUserId, friend_id: userId },
    ]);
    
  if (friendshipError) {
    console.error('Error creating friendship:', friendshipError);
    return { success: false, error: friendshipError.message };
  }
  
  // Notify the sender
  await createNotification({
    user_id: fromUserId,
    from_user_id: userId,
    from_username: username,
    from_avatar_url: avatarUrl,
    notification_type: 'friend_accepted',
    content: `${username} accepted your friend request!`,
  });
  
  return { success: true };
}

// Decline friend request
export async function declineFriendRequest(requestId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'declined', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('to_user_id', userId);
    
  if (error) {
    console.error('Error declining friend request:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

// Remove friend
export async function removeFriend(userId: string, friendId: string): Promise<{ success: boolean; error?: string }> {
  // Delete both directions of friendship
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
    
  if (error) {
    console.error('Error removing friend:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

// Get friends list
export async function getFriends(userId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      friend_id,
      friend:users!friendships_friend_id_fkey(
        id,
        username,
        avatar_url,
        created_at
      )
    `)
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error getting friends:', error);
    return [];
  }
  
  // Extract friend data
  return (data || [])
    .map((f: any) => f.friend)
    .filter((f: any) => f !== null) as User[];
}

// Get pending friend requests (received)
export async function getPendingRequests(userId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select(`
      *,
      from_user:users!friend_requests_from_user_id_fkey(
        id,
        username,
        avatar_url,
        created_at
      )
    `)
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error getting pending requests:', error);
    return [];
  }
  
  return (data || []).map((r: any) => ({
    ...r,
    from_user: r.from_user,
  })) as FriendRequest[];
}

// Get sent friend requests
export async function getSentRequests(userId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select(`
      *,
      to_user:users!friend_requests_to_user_id_fkey(
        id,
        username,
        avatar_url,
        created_at
      )
    `)
    .eq('from_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error getting sent requests:', error);
    return [];
  }
  
  return (data || []).map((r: any) => ({
    ...r,
    to_user: r.to_user,
  })) as FriendRequest[];
}

// Search users by username
export async function searchUsers(query: string, currentUserId: string): Promise<UserProfile[]> {
  if (query.length < 2) return [];
  
  const { data, error } = await supabase
    .from('users')
    .select('id, username, avatar_url, created_at')
    .ilike('username', `%${query}%`)
    .neq('id', currentUserId)
    .limit(20);
    
  if (error) {
    console.error('Error searching users:', error);
    return [];
  }
  
  // Check friendship status for each user
  const usersWithStatus = await Promise.all(
    (data || []).map(async (user) => {
      const { data: friendship } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${user.id}),and(user_id.eq.${user.id},friend_id.eq.${currentUserId})`)
        .single();
        
      const { data: pendingRequest } = await supabase
        .from('friend_requests')
        .select('id')
        .or(`and(from_user_id.eq.${currentUserId},to_user_id.eq.${user.id}),and(from_user_id.eq.${user.id},to_user_id.eq.${currentUserId})`)
        .eq('status', 'pending')
        .single();
        
      return {
        ...user,
        is_friend: !!friendship,
        has_pending_request: !!pendingRequest,
      } as UserProfile;
    })
  );
  
  return usersWithStatus;
}

// Get friend count
export async function getFriendCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error getting friend count:', error);
    return 0;
  }
  
  return count || 0;
}

// Check if two users are friends
export async function areFriends(userId: string, otherUserId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('friendships')
    .select('id')
    .or(`and(user_id.eq.${userId},friend_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},friend_id.eq.${userId})`)
    .single();
    
  if (error || !data) {
    return false;
  }
  
  return true;
}

// Notify friends when user checks in
export async function notifyFriendsOfCheckin(
  userId: string,
  username: string,
  avatarUrl: string | undefined,
  venueName: string,
  venueId: string
): Promise<void> {
  // Get all friends
  const friends = await getFriends(userId);
  
  // Create notification for each friend
  await Promise.all(
    friends.map((friend) =>
      createNotification({
        user_id: friend.id,
        from_user_id: userId,
        from_username: username,
        from_avatar_url: avatarUrl,
        notification_type: 'friend_checkin',
        content: `${username} just checked in at ${venueName}`,
        venue_name: venueName,
        venue_id: venueId,
      })
    )
  );
}

