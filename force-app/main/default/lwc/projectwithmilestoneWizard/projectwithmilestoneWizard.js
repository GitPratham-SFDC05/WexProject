import { LightningElement, track, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getProjectWithMilestones
    from '@salesforce/apex/ProjectWizardController.getProjectWithMilestones';
import { refreshApex } from '@salesforce/apex';
import createMilestones from '@salesforce/apex/ProjectWizardController.createMilestones';
import createTasks from '@salesforce/apex/ProjectWizardController.createTasks';

export default class ProjectwithmilestoneWizard extends LightningElement {

    currentStep = '1';
    projectId;
    @track milestoneOptions = [];
    @track milestones = [];
    @track tasks = [];
    @track overview = [];
    @track project;
    selectedMilestone;
    projectCompletion = 0;

    @api recordId; // Automatically provided on Project__c record page

    project;        // Holds Project__c data
    milestones = [];

    milestoneColumns = [
        { label: 'Milestone Name', fieldName: 'Name', editable: true }
    ];

    @track wiredResult;

    statusOptions = [
        { label: 'Not Started', value: 'Not Started' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Complete', value: 'Complete' }
    ];

    @wire(getProjectWithMilestones, { projectId: '$recordId' })
    wiredProject(result) {
        this.wiredResult = result;

        if (result.data) {
            this.project = result.data;
            this.milestones = result.data.Project_Milestones__r || [];
        } else if (result.error) {
            console.error(result.error);
            this.project = null;
            this.milestones = [];
        }
    }





    get isStep1() { return this.currentStep === '1'; }
    get isStep2() { return this.currentStep === '2'; }
    get isStep3() { return this.currentStep === '3'; }
    get isStep4() { return this.currentStep === '4'; }


    handleProjectCreated(event) {
        this.projectId = event.detail.id;
        this.recordId = event.detail.id; // 
        this.currentStep = '2';
    }
    addMilestone() {
        this.milestones = [
            ...this.milestones,
            {
                key: Date.now(),
                Name: ''
            }
        ];
    }

    handleMilestoneNameChange(event) {
        const index = event.target.dataset.index;
        this.milestones[index].Name = event.target.value;
        this.milestones = [...this.milestones];
    }

    removeMilestone(event) {
        const index = event.target.dataset.index;
        this.milestones.splice(index, 1);
        this.milestones = [...this.milestones];
    }



    async saveMilestones() {
        if (this.milestones.length === 0 || this.milestones.some(m => !m.Name)) {
            this.showToast('Validation Error', 'All milestones must have a name', 'error');
            return;
        }

        const insertedMilestones = await createMilestones({
            projectId: this.projectId,
            records: this.milestones.map(m => ({ Name: m.Name }))
        });

        this.milestoneOptions = insertedMilestones.map(m => ({
            label: m.Name,
            value: m.Id
        }));

        await refreshApex(this.wiredResult); // 
        this.currentStep = '3';
    }



    handleMilestoneChange(event) {
        this.selectedMilestone = event.detail.value;
        this.tasks = [];
    }

    addTask() {
        this.tasks = [
            ...this.tasks,
            {
                key: Date.now(),        // UI-only key
                Name: '',
                Status__c: 'Not Started'
            }
        ];
    }

    handleTaskNameChange(event) {
        const index = event.target.dataset.index;
        this.tasks[index].Name = event.target.value;
        this.tasks = [...this.tasks]; // force reactivity
    }

    handleTaskStatusChange(event) {
        const index = event.target.dataset.index;
        this.tasks[index].Status__c = event.detail.value;
        this.tasks = [...this.tasks]; // force reactivity
    }




    async saveTasks() {
        if (!this.selectedMilestone) {
            this.showToast('Error', 'Select a milestone', 'error');
            return;
        }

        await createTasks({
            milestoneId: this.selectedMilestone,
            tasks: this.tasks.map(t => ({
                Name: t.Name,
                Status__c: t.Status__c
            }))
        });

        await refreshApex(this.wiredResult); // 
        this.currentStep = '4';
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }



}