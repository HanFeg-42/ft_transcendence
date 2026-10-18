import { useState, useEffect } from 'react';



export default function useBlockStatus(friendId: number, token: string | null){
  const [iBlockedThem, setIBlockedThem] = useState<boolean>(false);
  // const [theyBlockedMe, setTheyBlockedMe] = useState<boolean>(false);


    useEffect(() => {
        let isCancelled = false;
        if (!token) return;

        async function fetchBlockStatus() {
              try {
                const response = await fetch(`/api/chat/blocks/status/${friendId}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                  const data = await response.json();
                  if (!isCancelled) {
                    setIBlockedThem(data.iBlockedThem); 
                    // setTheyBlockedMe(data.theyBlockedMe);
                  }
                }
              } catch (err) {
                console.error("Failed to fetch block status", err);
              }
        }

        fetchBlockStatus();
        return () => { isCancelled = true; };

    }, [friendId, token]);

    async function toggleBlock(){
        let method = (!iBlockedThem) ? "POST" : "DELETE";
        try {
            const response = await fetch(`/api/chat/blocks/${friendId}`, {method,
              headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                setIBlockedThem(!iBlockedThem);
            }
          } catch (err) {
            console.error("Failed to fetch block status", err);
          }
    }

    return { iBlockedThem, toggleBlock };
}