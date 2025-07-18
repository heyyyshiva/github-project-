document.addEventListener('DOMContentLoaded', function() {
    // Project data structure with team information
    let projects = [];
    let currentImage = null;
    
    // Load projects from localStorage if available
    const storedProjects = localStorage.getItem('teamGithubProjects');
    if (storedProjects) {
        projects = JSON.parse(storedProjects);
    }
    
    // Initialize tech filter
    updateTechFilter();
    
    // Event listeners for filters
    document.getElementById('member-filter').addEventListener('change', filterProjects);
    document.getElementById('tech-filter').addEventListener('change', filterProjects);
    
    // Image upload handling
    const imageInput = document.getElementById('project-image');
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');
    const clearImageBtn = document.getElementById('clearImage');
    
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showNotification('Please select an image file', 'error');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                showNotification('Image must be less than 5MB', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                imagePreview.classList.add('active');
                currentImage = file;
            };
            reader.readAsDataURL(file);
        }
    });
    
    clearImageBtn.addEventListener('click', function(e) {
        e.preventDefault();
        clearImage();
    });
    
    function clearImage() {
        currentImage = null;
        previewImage.src = '';
        imagePreview.classList.remove('active');
        imageInput.value = '';
    }
    
    // Handle form submission
    const projectForm = document.getElementById('project-form');
    projectForm.addEventListener('submit', handleProjectSubmission);
    
    function handleProjectSubmission(e) {
        e.preventDefault();
        
        const progressBar = document.querySelector('.progress-bar');
        const progressContainer = document.querySelector('.upload-progress');
        progressContainer.style.display = 'block';
        
        let progress = 0;
        const interval = setInterval(async () => {
            progress += 5;
            progressBar.style.width = progress + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                
                let imageData = null;
                if (currentImage) {
                    // Convert image to base64 string for storage
                    const reader = new FileReader();
                    imageData = await new Promise((resolve) => {
                        reader.onload = (e) => resolve(e.target.result);
                        reader.readAsDataURL(currentImage);
                    });
                }
                
                const newProject = {
                    teamMember: document.getElementById('team-member').value,
                    title: document.getElementById('project-title').value,
                    url: document.getElementById('repo-url').value,
                    description: document.getElementById('project-desc').value,
                    techStack: document.getElementById('tech-stack').value,
                    role: document.getElementById('project-role').value,
                    collaborators: document.getElementById('team-members').value,
                    lastUpdated: 'Just now',
                    imageUrl: imageData
                };
                
                projects.unshift(newProject);
                localStorage.setItem('teamGithubProjects', JSON.stringify(projects));
                
                projectForm.reset();
                clearImage();
                progressContainer.style.display = 'none';
                progressBar.style.width = '0%';
                
                updateTechFilter();
                renderProjects();
                updateProfileStats();
                
                showNotification('Project added successfully!', 'success');
            }
        }, 50);
    }
    
    function updateTechFilter() {
        const techFilter = document.getElementById('tech-filter');
        const technologies = new Set();
        
        projects.forEach(project => {
            if (project.techStack) {
                project.techStack.split(',').forEach(tech => {
                    technologies.add(tech.trim());
                });
            }
        });
        
        techFilter.innerHTML = '<option value="all">All Technologies</option>';
        
        technologies.forEach(tech => {
            const option = document.createElement('option');
            option.value = tech;
            option.textContent = tech;
            techFilter.appendChild(option);
        });
    }
    
    function filterProjects() {
        const memberFilter = document.getElementById('member-filter').value;
        const techFilter = document.getElementById('tech-filter').value;
        
        const filteredProjects = projects.filter(project => {
            const memberMatch = memberFilter === 'all' || project.teamMember === memberFilter;
            const techMatch = techFilter === 'all' || (project.techStack && project.techStack.includes(techFilter));
            return memberMatch && techMatch;
        });
        
        renderProjects(filteredProjects);
    }
    
    function renderProjects(projectsToRender = projects) {
        const repoGrid = document.getElementById('repo-grid');
        repoGrid.innerHTML = '';
        
        if (projectsToRender.length === 0) {
            repoGrid.innerHTML = '<p class="no-projects">No projects found. Add your first team project above!</p>';
            return;
        }
        
        projectsToRender.forEach((project, index) => {
            const card = document.createElement('div');
            card.className = 'repo-card';
            
            card.innerHTML = `
                <div class="member-tag">${project.teamMember}</div>
                ${project.imageUrl ? `<div class="project-image"><img src="${project.imageUrl}" alt="${project.title}"></div>` : ''}
                <h3 class="repo-title">${project.title}</h3>
                <p class="repo-desc">${project.description || 'No description provided.'}</p>
                <div class="repo-meta">
                    <span>${project.techStack || 'Not specified'}</span>
                    <span>Last updated: ${project.lastUpdated}</span>
                </div>
                <div class="team-info">
                    <p><strong>Role:</strong> ${project.role || 'Not specified'}</p>
                    <p><strong>Team:</strong> ${project.collaborators || 'Solo project'}</p>
                </div>
                <div class="card-actions">
                    <a href="${project.url}" target="_blank" class="repo-link">View on GitHub</a>
                    <button class="delete-btn" data-project-id="${index}">Delete Project</button>
                </div>
            `;
            
            // Add event listener for delete button
            const deleteBtn = card.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const projectId = parseInt(e.target.dataset.projectId);
                const projectTitle = projectsToRender[projectId].title;

                // Create delete confirmation popup
                const deletePopup = document.createElement('div');
                deletePopup.className = 'delete-popup';
                deletePopup.innerHTML = `
                    <div class="delete-content">
                        <div class="delete-icon">!</div>
                        <h3>Delete Project?</h3>
                        <p>Are you sure you want to delete "${projectTitle}"?</p>
                        <div class="delete-actions">
                            <button class="cancel-btn">Cancel</button>
                            <button class="confirm-btn">Delete</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(deletePopup);

                // Add styles
                const style = document.createElement('style');
                style.textContent = `
                    .delete-popup {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: #1E2132;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 12px;
                        padding: 30px;
                        text-align: center;
                        z-index: 1000;
                        min-width: 320px;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                        backdrop-filter: blur(10px);
                        animation: popIn 0.3s ease-out forwards;
                    }

                    .delete-content {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 15px;
                    }

                    .delete-icon {
                        width: 50px;
                        height: 50px;
                        background: #ff4757;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        color: white;
                        font-weight: bold;
                    }

                    .delete-popup h3 {
                        color: #fff;
                        margin: 0;
                        font-size: 1.4rem;
                    }

                    .delete-popup p {
                        color: #a3b1d6;
                        margin: 0;
                        font-size: 1rem;
                        max-width: 280px;
                    }

                    .delete-actions {
                        display: flex;
                        gap: 12px;
                        margin-top: 10px;
                    }

                    .delete-actions button {
                        padding: 10px 24px;
                        border: none;
                        border-radius: 6px;
                        font-size: 1rem;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        min-width: 100px;
                    }

                    .cancel-btn {
                        background: #2d3246;
                        color: #fff;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }

                    .confirm-btn {
                        background: #ff4757;
                        color: white;
                    }

                    .cancel-btn:hover {
                        background: #363b52;
                        transform: translateY(-2px);
                    }

                    .confirm-btn:hover {
                        background: #ff3344;
                        transform: translateY(-2px);
                    }

                    @keyframes popIn {
                        0% { opacity: 0; transform: translate(-50%, -45%); }
                        100% { opacity: 1; transform: translate(-50%, -50%); }
                    }

                    .delete-popup.closing {
                        animation: popOut 0.3s ease-in forwards;
                    }

                    @keyframes popOut {
                        0% { opacity: 1; transform: translate(-50%, -50%); }
                        100% { opacity: 0; transform: translate(-50%, -55%); }
                    }
                `;
                document.head.appendChild(style);

                // Add event listeners
                const cancelBtn = deletePopup.querySelector('.cancel-btn');
                const confirmBtn = deletePopup.querySelector('.confirm-btn');

                function closePopup() {
                    deletePopup.classList.add('closing');
                    setTimeout(() => {
                        deletePopup.remove();
                        style.remove();
                    }, 300);
                }

                cancelBtn.addEventListener('click', closePopup);

                confirmBtn.addEventListener('click', () => {
                    deleteProject(projectId);
                    closePopup();
                });
            });
            
            repoGrid.appendChild(card);
        });
    }
    
    function deleteProject(index) {
        if (index >= 0 && index < projects.length) {
            projects.splice(index, 1);
            localStorage.setItem('teamGithubProjects', JSON.stringify(projects));
            updateTechFilter();
            renderProjects();
            updateProfileStats();
            showNotification('Project deleted successfully!', 'success');
        }
    }
    
    function updateProfileStats() {
        document.querySelectorAll('.profile-card').forEach(card => {
            const memberId = card.dataset.member;
            const projectCount = projects.filter(project => project.teamMember === memberId).length;
            card.querySelector('.stat-number').textContent = projectCount;
        });
    }
    
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <div class="notification-progress"></div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Initial render
    renderProjects();
    updateProfileStats();
});
