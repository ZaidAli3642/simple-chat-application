import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { BsThreeDotsVertical } from "react-icons/bs";
import { HiOutlineEmojiHappy } from "react-icons/hi";
import { Popover } from "react-tiny-popover";
import { v4 as uuid } from "uuid";

import { auth, firestore, database } from "./firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  collection,
  orderBy,
  query,
  serverTimestamp,
  addDoc,
  doc,
  deleteDoc,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";

const emojis = ["😀", "🤝", "👍"];

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header>
        <p>Simple chat application</p>
        <SignOut />
      </header>

      <section>{user ? <ChatRoom /> : <SignIn />}</section>
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    await signInWithPopup(auth, provider);
  };

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>
        Sign in with Google
      </button>
    </>
  );
}

function SignOut() {
  return (
    auth.currentUser && (
      <button className="sign-out" onClick={() => auth.signOut()}>
        Sign Out
      </button>
    )
  );
}

function ChatRoom() {
  const [visiblity, setVisibility] = useState(false);
  const messagesRef = collection(firestore, "messages");

  const messageQuery = query(messagesRef, orderBy("createdAt"));

  const [messages, , , snapshot] = useCollectionData(messageQuery, {
    idField: "id",
  });

  const [formValue, setFormValue] = useState("");
  const [editValue, setIsEditValue] = useState(null);
  const [runEffect, setRunEffect] = useState(true);

  const updateMessage = async () => {
    setRunEffect(false);
    const messagesCollection = collection(firestore, "messages");
    const q = query(messagesCollection, where("uuid", "==", editValue.uuid));

    const messageDoc = await getDocs(q);
    const docRef = doc(firestore, "messages", messageDoc.docs?.[0]?.id);
    await updateDoc(docRef, { text: formValue });

    setFormValue("");
    setIsEditValue(null);
    setRunEffect(true);
  };

  const reactMessage = async ({ emoji, message }) => {
    const messagesCollection = collection(firestore, "messages");
    const q = query(messagesCollection, where("uuid", "==", message.uuid));

    const messageDoc = await getDocs(q);
    const messageData = messageDoc.docs?.[0].data();

    const filteredReactions = messageData.reactions.filter(
      (reaction) => reaction.userId !== auth.currentUser.uid
    );

    const reactions = [
      ...filteredReactions,
      { userId: auth.currentUser.uid, emoji },
    ];

    const docRef = doc(firestore, "messages", messageDoc.docs?.[0]?.id);

    await updateDoc(docRef, {
      reactions,
    });
  };

  const removeReaction = () => {};

  const sendMessage = async (e) => {
    e.preventDefault();

    if (editValue) return updateMessage();

    const { uid, photoURL } = auth.currentUser;

    await addDoc(messagesRef, {
      text: formValue,
      createdAt: serverTimestamp(),
      uid,
      photoURL,
      uuid: uuid(),
      reactions: [],
    });

    setFormValue("");
    const dummy = document.getElementById("scroll-to-down");
    dummy.scrollIntoView({ behavior: "smooth" });
  };

  const handleDeleteMessage = async (message) => {
    try {
      const messagesCollection = collection(firestore, "messages");
      const q = query(messagesCollection, where("uuid", "==", message.uuid));

      const messageDoc = await getDocs(q);
      const docRef = doc(firestore, "messages", messageDoc.docs?.[0]?.id);
      await deleteDoc(docRef);
    } catch (error) {
      console.log("Error :", error);
    }
  };

  const handleEditMessage = async (message) => {};

  useEffect(() => {
    if (!runEffect) return;

    if (messages) {
      const dummy = document.getElementById("scroll-to-down");
      dummy.scrollIntoView({});
    }
  }, [messages]);

  return (
    <div>
      <main className="message-container">
        <div id="content-ref" className={`messages`}>
          {messages?.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onDeleteMessage={() => handleDeleteMessage(msg)}
              onEditMessage={() => handleEditMessage(msg)}
              setIsEditValue={setIsEditValue}
              setFormValue={setFormValue}
              reactMessage={reactMessage}
            />
          ))}
        </div>
        <span id="scroll-to-down"></span>
      </main>

      <form onSubmit={sendMessage}>
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder="say something nice"
        />

        <button type="submit" disabled={!formValue}>
          🕊️
        </button>
      </form>
    </div>
  );
}

function ChatMessage(props) {
  const { text, uid, photoURL, reactions } = props.message;
  const {
    onEditMessage,
    onDeleteMessage,
    setIsEditValue,
    setFormValue,
    reactMessage,
  } = props;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isOpenEmojiPicker, setIsOpenEmojiPicker] = useState(false);

  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";

  return (
    <div>
      <div key={props.key} className={`message ${messageClass}`}>
        <img
          src={
            photoURL || "https://api.adorable.io/avatars/23/abott@adorable.png"
          }
        />
        <div style={{ position: "relative" }}>
          <p>{text}</p>
          {reactions?.length > 0 && (
            <div
              className={
                messageClass === "sent"
                  ? `reactions-sent`
                  : "reactions-received"
              }
            >
              {reactions.map((reaction) => (
                <span style={{ fontSize: "10px", marginInline: "2px" }}>
                  {reaction?.emoji}
                </span>
              ))}
            </div>
          )}
        </div>

        {messageClass !== "sent" && (
          <div className="emoji-container">
            <HiOutlineEmojiHappy
              size={"20px"}
              color="white"
              onClick={() => setIsOpenEmojiPicker(true)}
            />
            {isOpenEmojiPicker && (
              <div className="emoji-picker-container">
                {emojis.map((emoji) => (
                  <span
                    style={{ marginInline: "5px", fontSize: "20px" }}
                    onClick={() => {
                      reactMessage({ emoji, message: props.message });
                      setIsOpenEmojiPicker(false);
                    }}
                  >
                    {emoji}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {messageClass === "sent" && (
          <Popover
            isOpen={isPopoverOpen}
            positions={["top", "bottom", "left", "right"]} // preferred positions by priority
            content={
              <div className="message-options">
                <span
                  onClick={() => {
                    setIsEditValue(props.message);
                    setFormValue(props.message.text);
                    setIsPopoverOpen(false);
                  }}
                >
                  Edit
                </span>
                <span
                  onClick={() => {
                    onDeleteMessage(props.message);
                    setIsPopoverOpen(false);
                  }}
                >
                  Delete
                </span>
              </div>
            }
          >
            <div onClick={() => setIsPopoverOpen(!isPopoverOpen)}>
              <BsThreeDotsVertical
                color="white"
                cursor={"pointer"}
                size={"20px"}
              />
            </div>
          </Popover>
        )}
      </div>
    </div>
  );
}

export default App;
