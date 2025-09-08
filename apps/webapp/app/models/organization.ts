import { ObjectId } from 'mongodb';
import { connectToDatabase, COLLECTIONS } from '~/lib/database';
import type { Organization, CreateOrganization } from '~/types/database';

export class OrganizationModel {
  private static instance: OrganizationModel;

  private constructor() { }

  static getInstance(): OrganizationModel {
    if (!OrganizationModel.instance) {
      OrganizationModel.instance = new OrganizationModel();
    }
    return OrganizationModel.instance;
  }

  async create(orgData: CreateOrganization): Promise<Organization> {
    const db = await connectToDatabase();
    const organizations = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS);

    const now = new Date();
    const organization: Organization = {
      ...orgData,
      users: orgData.users || [orgData.owner],
      createdAt: now,
      updatedAt: now,
    };

    const result = await organizations.insertOne(organization);
    return { ...organization, _id: result.insertedId };
  }

  async findById(id: ObjectId | string): Promise<Organization | null> {
    const db = await connectToDatabase();
    const organizations = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS);
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return await organizations.findOne({ _id: objectId });
  }

  async findByOwner(ownerId: ObjectId | string): Promise<Organization[]> {
    const db = await connectToDatabase();
    const organizations = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS);
    const objectId = typeof ownerId === 'string' ? new ObjectId(ownerId) : ownerId;
    return await organizations.find({ owner: objectId }).toArray();
  }

  async findByUser(userId: ObjectId | string): Promise<Organization[]> {
    const db = await connectToDatabase();
    const organizations = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS);
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    return await organizations.find({ users: objectId }).toArray();
  }

  async update(id: ObjectId | string, updates: Partial<Organization>): Promise<Organization | null> {
    const db = await connectToDatabase();
    const organizations = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS);
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await organizations.findOneAndUpdate(
      { _id: objectId },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result || null;
  }

  async addUser(organizationId: ObjectId | string, userId: ObjectId | string): Promise<void> {
    const db = await connectToDatabase();
    const organizations = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS);
    const orgObjectId = typeof organizationId === 'string' ? new ObjectId(organizationId) : organizationId;
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    await organizations.updateOne(
      { _id: orgObjectId },
      { $addToSet: { users: userObjectId }, $set: { updatedAt: new Date() } }
    );
  }

  async removeUser(organizationId: ObjectId | string, userId: ObjectId | string): Promise<void> {
    const db = await connectToDatabase();
    const organizations = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS);
    const orgObjectId = typeof organizationId === 'string' ? new ObjectId(organizationId) : organizationId;
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    await organizations.updateOne(
      { _id: orgObjectId },
      { $pull: { users: userObjectId }, $set: { updatedAt: new Date() } }
    );
  }

  async delete(id: ObjectId | string): Promise<boolean> {
    const db = await connectToDatabase();
    const organizations = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS);
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await organizations.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }
}

export const organizationModel = OrganizationModel.getInstance();


