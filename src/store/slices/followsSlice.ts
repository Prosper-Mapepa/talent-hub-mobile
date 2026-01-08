import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import { User } from '../../types';

interface FollowsState {
  followers: Record<string, User[]>; // userId -> followers[]
  following: Record<string, User[]>; // userId -> following[]
  followStatus: Record<string, boolean>; // "followerId-followingId" -> isFollowing
  isLoading: boolean;
  error: string | null;
}

const initialState: FollowsState = {
  followers: {},
  following: {},
  followStatus: {},
  isLoading: false,
  error: null,
};

// Async thunks
export const followUser = createAsyncThunk(
  'follows/followUser',
  async ({ followerId, followingId }: { followerId: string; followingId: string }, { rejectWithValue }) => {
    try {
      const result = await apiService.followUser(followerId, followingId);
      return { followerId, followingId, result };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to follow user');
    }
  }
);

export const unfollowUser = createAsyncThunk(
  'follows/unfollowUser',
  async ({ followerId, followingId }: { followerId: string; followingId: string }, { rejectWithValue }) => {
    try {
      const result = await apiService.unfollowUser(followerId, followingId);
      return { followerId, followingId, result };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to unfollow user');
    }
  }
);

export const fetchFollowers = createAsyncThunk(
  'follows/fetchFollowers',
  async (userId: string, { rejectWithValue }) => {
    try {
      const followers = await apiService.getFollowers(userId);
      return { userId, followers };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch followers');
    }
  }
);

export const fetchFollowing = createAsyncThunk(
  'follows/fetchFollowing',
  async (userId: string, { rejectWithValue }) => {
    try {
      const following = await apiService.getFollowing(userId);
      return { userId, following };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch following');
    }
  }
);

export const checkFollowStatus = createAsyncThunk(
  'follows/checkFollowStatus',
  async ({ followerId, followingId }: { followerId: string; followingId: string }, { rejectWithValue }) => {
    try {
      const isFollowing = await apiService.checkFollowStatus(followerId, followingId);
      return { followerId, followingId, isFollowing };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check follow status');
    }
  }
);

const followsSlice = createSlice({
  name: 'follows',
  initialState,
  reducers: {
    clearFollows: (state) => {
      state.followers = {};
      state.following = {};
      state.followStatus = {};
      state.error = null;
    },
    setFollowStatus: (state, action: PayloadAction<{ followerId: string; followingId: string; isFollowing: boolean }>) => {
      const { followerId, followingId, isFollowing } = action.payload;
      const key = `${followerId}-${followingId}`;
      state.followStatus[key] = isFollowing;
    },
  },
  extraReducers: (builder) => {
    builder
      // Follow user
      .addCase(followUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(followUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const { followerId, followingId } = action.payload;
        const key = `${followerId}-${followingId}`;
        state.followStatus[key] = true;
      })
      .addCase(followUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Unfollow user
      .addCase(unfollowUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unfollowUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const { followerId, followingId } = action.payload;
        const key = `${followerId}-${followingId}`;
        state.followStatus[key] = false;
      })
      .addCase(unfollowUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch followers
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        const { userId, followers } = action.payload;
        state.followers[userId] = followers;
      })
      // Fetch following
      .addCase(fetchFollowing.fulfilled, (state, action) => {
        const { userId, following } = action.payload;
        state.following[userId] = following;
      })
      // Check follow status
      .addCase(checkFollowStatus.fulfilled, (state, action) => {
        const { followerId, followingId, isFollowing } = action.payload;
        const key = `${followerId}-${followingId}`;
        state.followStatus[key] = isFollowing;
      });
  },
});

export const { clearFollows, setFollowStatus } = followsSlice.actions;
export default followsSlice.reducer;

