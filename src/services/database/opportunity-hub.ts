export class OpportunityHubDBService {
  static async getSavedOpportunities(studentId: string) {
    if(!studentId) return [];
    // Return saved scholarships/activities
    // return await prisma.saved_opportunities.findMany({ where: { student_id: studentId } });
    return [];
  }
}
