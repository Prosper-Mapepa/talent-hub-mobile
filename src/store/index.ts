import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import jobsReducer from './slices/jobsSlice';
import studentsReducer from './slices/studentsSlice';
import businessesReducer from './slices/businessesSlice';
import messagesReducer from './slices/messagesSlice';
import adminReducer from './slices/adminSlice';
import talentsReducer from './slices/talentsSlice';
import followsReducer from './slices/followsSlice';
import { TypedUseSelectorHook, useSelector, useDispatch } from 'react-redux';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    jobs: jobsReducer,
    students: studentsReducer,
    businesses: businessesReducer,
    messages: messagesReducer,
    admin: adminReducer,
    talents: talentsReducer,
    follows: followsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch = () => useDispatch<AppDispatch>(); 