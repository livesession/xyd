import { ObjectId } from 'mongodb';

import { connectToDatabase, COLLECTIONS } from '~/lib/database';
import type { User, CreateUser } from '~/types/database';

export class UserModel {
  private static instance: UserModel;

  private constructor() {}

  static getInstance(): UserModel {
    if (!UserModel.instance) {
      UserModel.instance = new UserModel();
    }
    return UserModel.instance;
  }

  async create(userData: CreateUser): Promise<User> {
    const db = await connectToDatabase();
    const users = db.collection<User>(COLLECTIONS.USERS);

    const now = new Date();
    const user: User = {
      ...userData,
      organizations: userData.organizations || [],
      createdAt: now,
      updatedAt: now,
    };

    const result = await users.insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  async findByEmail(email: string): Promise<User | null> {
    const db = await connectToDatabase();
    const users = db.collection<User>(COLLECTIONS.USERS);
    return await users.findOne({ email });
  }

  async findById(id: ObjectId | string): Promise<User | null> {
    const db = await connectToDatabase();
    const users = db.collection<User>(COLLECTIONS.USERS);
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return await users.findOne({ _id: objectId });
  }

  async update(id: ObjectId | string, updates: Partial<User>): Promise<User | null> {
    const db = await connectToDatabase();
    const users = db.collection<User>(COLLECTIONS.USERS);
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await users.findOneAndUpdate(
      { _id: objectId },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result || null;
  }

  async addOrganization(userId: ObjectId | string, organizationId: ObjectId | string): Promise<void> {
    const db = await connectToDatabase();
    const users = db.collection<User>(COLLECTIONS.USERS);
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const orgObjectId = typeof organizationId === 'string' ? new ObjectId(organizationId) : organizationId;
    await users.updateOne(
      { _id: userObjectId },
      { $addToSet: { organizations: orgObjectId }, $set: { updatedAt: new Date() } }
    );
  }

  async removeOrganization(userId: ObjectId | string, organizationId: ObjectId | string): Promise<void> {
    const db = await connectToDatabase();
    const users = db.collection<User>(COLLECTIONS.USERS);
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const orgObjectId = typeof organizationId === 'string' ? new ObjectId(organizationId) : organizationId;
    await users.updateOne(
      { _id: userObjectId },
      { $pull: { organizations: orgObjectId }, $set: { updatedAt: new Date() } }
    );
  }

  async findByOrganization(organizationId: ObjectId | string): Promise<User[]> {
    const db = await connectToDatabase();
    const users = db.collection<User>(COLLECTIONS.USERS);
    const orgObjectId = typeof organizationId === 'string' ? new ObjectId(organizationId) : organizationId;
    return await users.find({ organizations: orgObjectId }).toArray();
  }
}

export const userModel = UserModel.getInstance();


