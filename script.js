// ===== INITIALIZE APP =====

// This array will store all reminders
// We load existing reminders from localStorage when page loads
let reminders = JSON.parse(localStorage.getItem('taxReminders')) || [];

// Current filter selected (all, urgent, upcoming, overdue)
let currentFilter = 'all';

// ===== WAIT FOR PAGE TO LOAD =====

// This code runs when the entire HTML page has loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Get the form element from HTML
    const form = document.getElementById('reminderForm');
    
    // Get all filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // When form is submitted, run addReminder function
    form.addEventListener('submit', addReminder);
    
    // Add click event to each filter button
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove 'active' class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add 'active' class to clicked button
            this.classList.add('active');
            // Get the filter type from button's data-filter attribute
            currentFilter = this.getAttribute('data-filter');
            // Display reminders based on new filter
            displayReminders();
        });
    });
    
    // Display all existing reminders when page loads
    displayReminders();
});

// ===== ADD NEW REMINDER FUNCTION =====

function addReminder(e) {
    // Prevent form from refreshing the page (default behavior)
    e.preventDefault();
    
    // Get values from form inputs using their IDs
    const orgName = document.getElementById('orgName').value;
    const taxType = document.getElementById('taxType').value;
    const dueDate = document.getElementById('dueDate').value;
    const amount = document.getElementById('amount').value;
    const notes = document.getElementById('notes').value;
    
    // Create a reminder object with all the information
    const reminder = {
        id: Date.now(), // Unique ID using current timestamp
        orgName: orgName,
        taxType: taxType,
        dueDate: dueDate,
        amount: amount,
        notes: notes,
        createdAt: new Date().toISOString() // When reminder was created
    };
    
    // Add the new reminder to our array
    reminders.push(reminder);
    
    // Save all reminders to localStorage (browser storage)
    // JSON.stringify converts JavaScript object to text
    localStorage.setItem('taxReminders', JSON.stringify(reminders));
    
    // Clear all form fields
    document.getElementById('reminderForm').reset();
    
    // Update the display to show new reminder
    displayReminders();
}

// ===== DISPLAY REMINDERS FUNCTION =====

function displayReminders() {
    // Get the div where we'll display reminders
    const remindersList = document.getElementById('remindersList');
    
    // Filter reminders based on current filter
    let filteredReminders = filterReminders(reminders, currentFilter);
    
    // Sort reminders by due date (earliest first)
    filteredReminders.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    // If no reminders, show a message
    if (filteredReminders.length === 0) {
        remindersList.innerHTML = '<p class="no-reminders">No reminders found for this filter.</p>';
        return;
    }
    
    // Clear the list
    remindersList.innerHTML = '';
    
    // Loop through each reminder and create HTML for it
    filteredReminders.forEach(reminder => {
        // Create a div element for this reminder
        const card = document.createElement('div');
        card.className = 'reminder-card';
        
        // Calculate days until due date
        const daysUntil = calculateDaysUntil(reminder.dueDate);
        
        // Determine urgency level
        const urgency = getUrgency(daysUntil);
        
        // Add urgency class to card
        card.classList.add(urgency.class);
        
        // Build the HTML content for this reminder card
        card.innerHTML = `
            <div class="reminder-header">
                <div>
                    <div class="reminder-title">${reminder.orgName}</div>
                    <span class="reminder-status status-${urgency.class}">${urgency.label}</span>
                </div>
            </div>
            
            <div class="reminder-details">
                <div class="reminder-detail">
                    <strong>Tax/Levy:</strong> ${reminder.taxType}
                </div>
                <div class="reminder-detail">
                    <strong>Due Date:</strong> ${formatDate(reminder.dueDate)} (${daysUntil >= 0 ? daysUntil + ' days left' : Math.abs(daysUntil) + ' days overdue'})
                </div>
                ${reminder.amount ? `
                <div class="reminder-detail">
                    <strong>Amount:</strong> $${parseFloat(reminder.amount).toLocaleString()}
                </div>
                ` : ''}
                ${reminder.notes ? `
                <div class="reminder-notes">
                    <strong>Notes:</strong> ${reminder.notes}
                </div>
                ` : ''}
            </div>
            
            <button class="btn-delete" onclick="deleteReminder(${reminder.id})">Delete</button>
        `;
        
        // Add this card to the list
        remindersList.appendChild(card);
    });
}

// ===== CALCULATE DAYS UNTIL DUE DATE =====

function calculateDaysUntil(dueDate) {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get due date at midnight
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    // Calculate difference in milliseconds
    const diffTime = due - today;
    
    // Convert milliseconds to days
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

// ===== DETERMINE URGENCY LEVEL =====

function getUrgency(daysUntil) {
    // If overdue (negative days)
    if (daysUntil < 0) {
        return {
            class: 'overdue',
            label: 'OVERDUE'
        };
    }
    // If due within 7 days
    else if (daysUntil <= 7) {
        return {
            class: 'urgent',
            label: 'URGENT'
        };
    }
    // If due within 30 days
    else if (daysUntil <= 30) {
        return {
            class: 'upcoming',
            label: 'UPCOMING'
        };
    }
    // More than 30 days away
    else {
        return {
            class: 'normal',
            label: 'SCHEDULED'
        };
    }
}

// ===== FILTER REMINDERS =====

function filterReminders(reminders, filter) {
    // If showing all, return everything
    if (filter === 'all') {
        return reminders;
    }
    
    // Filter based on selected option
    return reminders.filter(reminder => {
        const daysUntil = calculateDaysUntil(reminder.dueDate);
        const urgency = getUrgency(daysUntil);
        
        // Return true if reminder matches filter
        return urgency.class === filter;
    });
}

// ===== FORMAT DATE FOR DISPLAY =====

function formatDate(dateString) {
    // Create date object from string
    const date = new Date(dateString);
    
    // Options for how to format the date
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    // Return formatted date (e.g., "January 15, 2024")
    return date.toLocaleDateString('en-US', options);
}

// ===== DELETE REMINDER =====

function deleteReminder(id) {
    // Ask user to confirm deletion
    if (confirm('Are you sure you want to delete this reminder?')) {
        // Filter out the reminder with matching ID
        // This removes it from the array
        reminders = reminders.filter(reminder => reminder.id !== id);
        
        // Update localStorage with new array
        localStorage.setItem('taxReminders', JSON.stringify(reminders));
        
        // Refresh the display
        displayReminders();
    }
          }
