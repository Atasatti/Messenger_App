import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, User } from "firebase/auth";
import { UserDbServices } from "./UserDbServices";
import { v4 } from "uuid";
import { auth, googleProvider } from "@/config/firebaseConfig";
import { ILoginData, IUser } from "@/types";

export class UserControllers {
    private static instance: UserControllers;
    private userDbServices: UserDbServices;

    private constructor() {
        this.userDbServices = UserDbServices.getInstance()
    }

    public static getInstance() {
        if (!UserControllers.instance) {
            UserControllers.instance = new UserControllers();
        }
        return UserControllers.instance;
    }


    public async continueWithGoogle() {
        try {
            const response = await signInWithPopup(auth, googleProvider);
            return response;
        } catch (error) {
            throw error;
        }
    }

    public async loginUser(data: ILoginData) {
        try {
            const response = await signInWithEmailAndPassword(auth, data.email, data.password)
            console.log(response)
            return response;
        } catch (error) {
            throw error;
        }
    }



    public async addUserFun(data: IUser) {
        try {
            const response = UserDbServices.getInstance().addUser(data)
            return response;
        } catch (error) {
            throw error;
        }
    }

    public async getCurrentUser(uid: string) {
        try {
            return await UserDbServices.getInstance().getCurrentUser(uid);
        } catch (error) {
            throw error
        }
    }



    public checkIfUserExists(email: string) {
        return UserDbServices.getInstance().checkIfUserExists(email);
    }

    public async uploadImage(image: File): Promise<string> {
        try {
            const id = v4();
            const imgURL: string = await UserDbServices.getInstance().addImageInDB(image, id)
            return imgURL;
        } catch (error) {
            console.log(error)
            throw error;
        }
    }

    public isUserSignedIn(): Promise<User | null> {
        return new Promise((resolve) => {
            onAuthStateChanged(auth, (user) => {
                resolve(user);
            });
        });
    }

}