import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';



import createMilestones from '@salesforce/apex/ProjectWizardController.createMilestones';
import createTasks from '@salesforce/apex/ProjectWizardController.createTasks';
import getOverview from '@salesforce/apex/ProjectWizardController.getProjectOverview';
import updateTask from '@salesforce/apex/ProjectWizardController.updateTaskStatus';
export default class ProjectwithmilestoneWizard extends LightningElement {

    currentStep = '1';
    projectId;
    @track milestoneOptions = [];
    @track milestones = [];
    @track tasks = [];
    @track overview = [];

    selectedMilestone;
    projectCompletion = 0;

    milestoneColumns = [
        { label: 'Milestone Name', fieldName: 'Name', editable: true }
    ];



    statusOptions = [
        { label: 'Not Started', value: 'Not Started' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Complete', value: 'Complete' }
    ];




    get isStep1() { return this.currentStep === '1'; }
    get isStep2() { return this.currentStep === '2'; }
    get isStep3() { return this.currentStep === '3'; }
    get isStep4() { return this.currentStep === '4'; }



    handleProjectCreated(event) {
        this.projectId = event.detail.id;
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
        if (this.milestones.length === 0) {
            this.showToast(
                'Validation Error',
                'Add at least one milestone.',
                'error'
            );
            return;
        }

        if (this.milestones.some(m => !m.Name)) {
            this.showToast(
                'Validation Error',
                'All milestones must have a name.',
                'error'
            );
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

        this.currentStep = '3';
    }



    async saveMilestones() {
        if (this.milestones.some(m => !m.Name)) {
            this.showToast(
                'Validation Error',
                'All milestones must have a name',
                'error'
            );
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
        const recordsToInsert = this.tasks.map(t => ({
            Name: t.Name,
            Status__c: t.Status__c
        }));

        await createTasks({
            milestoneId: this.selectedMilestone,
            tasks: recordsToInsert
        });

        this.loadOverview();
        this.currentStep = '4';
    }


    async loadOverview() {
        this.overview = await getOverview({ projectId: this.projectId });
        this.projectCompletion = Math.round(
            this.overview.reduce((sum, m) => sum + m.Completion_Percentage__c, 0) /
            this.overview.length
        );
    }

    async updateTaskStatus(event) {
        await updateTask({ taskId: event.target.dataset.id, status: event.detail.value });
        this.loadOverview();
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }



}