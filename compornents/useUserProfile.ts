import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";

export interface UserProfile {
  nickname: string;
  avatarText: string;
  email?: string;
}

export function useUserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const unsubscribeDoc = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setProfile({
                nickname: data.nickname || "名無し",
                avatarText: data.avatarText || "??",
                email: currentUser.email || "",
              });
            } else {
              setProfile(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("プロフィールリアルタイム取得エラー:", error);
            setLoading(false);
          }
        );

        return () => unsubscribeDoc();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return { user, profile, loading };
}