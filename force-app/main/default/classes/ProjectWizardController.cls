/**
 * ProjectWizardController
 * -----------------------
 * Handles Project creation along with Milestones and Tasks
 * and provides Project overview data for LWC UI.
 *
 * Best Practices:
 * - with sharing
 * - DTO pattern
 * - Single transaction
 * - Bulk-safe inserts
 * - Cacheable read method
 * - AuraHandledException for clean UI errors
 */
public with sharing class ProjectWizardController {

    @AuraEnabled
    public static List<Project_Milestone__c> createMilestones(Id projectId, List<Project_Milestone__c> records) {
        if (projectId == null) {
            throw new AuraHandledException('Project Id is required.');
        }
        
        if (records == null || records.isEmpty()) {
            throw new AuraHandledException('No milestones to create.');
        }
        
        for (Project_Milestone__c m : records) {
            m.Project__c = projectId;
        }
        
        insert records;
        return records;
    }

    @AuraEnabled
    public static void createTasks(   Id milestoneId,         List<Project_Task__c> tasks    ) {
        if (milestoneId == null) {
            throw new AuraHandledException('Milestone not selected.');
        }
        
        if (tasks == null || tasks.isEmpty()) {
            throw new AuraHandledException('No tasks to create.');
        }
        
        for (Project_Task__c t : tasks) {
            t.Project_Milestone__c = milestoneId;
        }
        
        insert tasks;
    }


    @AuraEnabled(cacheable=true)
    public static List<Project_Milestone__c> getProjectOverview(Id projectId) {
        if (projectId == null) {
            return new List<Project_Milestone__c>();
        }
        
        return [
            SELECT Id, Name, Completion_Percentage__c, Milestone_Status__c,
            (SELECT Id, Name, Status__c FROM Project_Tasks__r)
            FROM Project_Milestone__c
            WHERE Project__c = :projectId
            ORDER BY CreatedDate
        ];
    }


    @AuraEnabled
    public static void updateTaskStatus(Id taskId, String status) {
        if (taskId == null) {
            throw new AuraHandledException('Task Id is required.');
        }
        
        List<String> allowedValues = new List<String>{
            'Not Started', 'In Progress', 'Complete'
                };
                    
                    if (!allowedValues.contains(status)) {
                        throw new AuraHandledException('Invalid Status value.');
                    }
        
        update new Project_Task__c(
            Id = taskId,
            Status__c = status
        );
    }

}