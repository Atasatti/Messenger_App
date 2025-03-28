import { DB_COLLECTIONS, FriendRequestStatus } from "@/config/constants";
import { database } from "@/config/firebaseConfig";
import { addDoc, collection, CollectionReference, doc, DocumentData, getDoc, getDocs, onSnapshot, query, QuerySnapshot, setDoc, Timestamp, updateDoc, where } from "firebase/firestore";
import { UserDbServices } from "../user/UserDbServices";
import { IRequestResponse } from "@/types";

export class RequestDbServices {
    private static instance: RequestDbServices;
    private requestCollection: CollectionReference;

    private constructor() {
        this.requestCollection = collection(database, DB_COLLECTIONS.REQUESTS);
    }

    public static getInstance() {
        if (!RequestDbServices.instance) {
            RequestDbServices.instance = new RequestDbServices();
        }
        return RequestDbServices.instance;
    }

    public async getRequestCollectionInstance() {
        return this.requestCollection;
    }

    public async getReciever(recieverEmail: string) {
        return await UserDbServices.getInstance().getReciever(recieverEmail);
    }

    public async sendRequest(senderData: any, receiverId: string) {
        try {
            return await addDoc(this.requestCollection, {
                senderData,
                receiverId,
                status: FriendRequestStatus.PENDING,
                sentAt: Timestamp.now(),
            })
        } catch (error) {
            console.log(error)
            return error;
        }
    }

    public async getRequestsByCurrentUserId(currentUserId: string) {
        const q = query(this.requestCollection,
            where("receiverId", "==", currentUserId),
            where("status", "==", FriendRequestStatus.PENDING),
        )
        onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type == "added") {
                    console.log('New friend request: ', change.doc.data());
                }
            })
        })
    }


    public async createChatRoom(currentUserId: string, otherUserId: string) {
        const chatRoomId = [currentUserId, otherUserId].sort().join('_');
        try {
            await addDoc(collection(database, DB_COLLECTIONS.CHAT_ROOMS), {
                chatRoomId,
                participants: [currentUserId, otherUserId],
                createdAt: new Date(),
                lastMessage: null
            })
            return chatRoomId;
        } catch (error) {
            console.log(error);
            throw error;
        }

    };


    public async initiateChat(currentUserId: string, otherUserId: string) {
        try {
            // const chatRoomId = [currentUserId, otherUserId].sort().join('_');
            // const chatRoomRef = doc(database, DB_COLLECTIONS.CHAT_ROOMS, chatRoomId);
            // const chatRoom = await getDoc(chatRoomRef);
            // console.log(chatRoom, "chatroom")
            // if (!chatRoom.exists()) {
            const chatRoomId = await this.createChatRoom(currentUserId, otherUserId);
            // }

            return chatRoomId;
        } catch (error) {
            console.error('Error initiating chat:', error);
            throw error;
        }
    };
    public async acceptRequest(requestId: string, senderId: string, currentUserId: string) {
        const docRef = doc(this.requestCollection, requestId);
        try {
            await updateDoc(docRef, {
                status: FriendRequestStatus.ACCEPTED
            });

            const chatRoomId = await this.initiateChat(senderId, currentUserId);
            return chatRoomId;
        } catch (error) {
            console.log(error);
            return error;
        }
    }


    public async declineRequest(requestId: string) {
        const docRef = doc(this.requestCollection, requestId);
        try {
            return await updateDoc(docRef, {
                status: FriendRequestStatus.REJECTED
            })
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    public async fetchAcceptedRequests(currentUserId: string) {
        try {
            const q1 = query(this.requestCollection, where("receiverId", "==", currentUserId), where("status", "==", FriendRequestStatus.ACCEPTED));
            const q2 = query(this.requestCollection, where("senderId", "==", currentUserId), where("status", "==", FriendRequestStatus.ACCEPTED));
            const snapshot1 = await getDocs(q1);
            const snapshot2 = await getDocs(q2);
            const combinedResults = [
                ...snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                ...snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            ];
            return combinedResults;

        } catch (error) {
            console.log(error);
            return error;
        }
    }
}