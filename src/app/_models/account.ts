import { Role } from './role';

export class Account {
    id: string;
    title: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    role: Role;
    isActive: boolean;
    jwtToken?: string;
    profilePicture?: string;
    birthDate?: string;        
    gender?: string;            
    civilStatus?: string;       
    contactNumber?: string; 
}