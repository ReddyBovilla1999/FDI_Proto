let testCaseCounter = 0;
let selectedTopics = [];
let selectedLanguages = [];
let editingTestCaseIndex = -1;
let codeStubs = {};
let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordedVideoBlob = null;

const languageTemplates = {
    java7: `
import java.util.*;

class Solution {
    public {{returnType}} {{functionName}}({{parameters}}) {

    }
}

public class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();
        Scanner sc = new Scanner(System.in);

         System.out.println(sol.{{functionName}}(a, b));
        sc.close();
    }
}`,
    java8: `
import java.util.*;
import java.io.*;

class Solution {
    public {{returnType}} {{functionName}}({{parameters}}) {

    }
}

public class Main {
    public static void main(String[] args) throws IOException {
        Solution sol = new Solution();
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));

    }
}`,
    java11: `
import java.util.*;
import java.io.*;

class Solution {
    public {{returnType}} {{functionName}}({{parameters}}) {

    }
}

public class Main {
    public static void main(String[] args) throws IOException {
        Solution sol = new Solution();

    }
}`,
    
    python27: `
import sys

class Solution:
    def {{functionName}}(self, {{parameters}}):
        # Your code here
        pass

def main():
    sol = Solution();
    # The following is an example of how to read input and call the solution method.
    # You can modify this as needed.
    # line = sys.stdin.readline().strip()
    # parts = line.split()
    # a = int(parts[0])
    # b = int(parts[1])
    # print sol.{{functionName}}(a, b)

if __name__ == "__main__":
    main()
`,
    python3: `
import sys

class Solution:
    def {{functionName}}(self, {{parameters}}):
        # Your code here
        pass

def main():
    sol = Solution();
    # The following is an.example of how to read input and call the solution method.
    # You can modify this as needed.
    # line = sys.stdin.readline().strip()
    # parts = line.split()
    # a = int(parts[0])
    # b = int(parts[1])
    # print(sol.{{functionName}}(a, b))

if __name__ == "__main__":
    main()
`,
    
    
    cpp: `
#include <iostream>
#include <vector>
#include <string>

class Solution {
public:
    {{returnType}} {{functionName}}({{parameters}}) {

    }
};

int main() {
    Solution sol;

    return 0;
}`,
    c: `
#include <stdio.h>


{{returnType}} {{functionName}}({{parameters}}) {

}

int main() {

    return 0;
}`,
    
    typescript: `
class Solution {
    public {{functionName}}({{parameters}}): {{returnType}} {

    }
}

function main() {
    const sol = new Solution();

}

main();
`,
    typescript545: `
class Solution {
    public {{functionName}}({{parameters}}): {{returnType}} {

    }
}


function main() {
    const sol = new Solution();

}

main();
`,
    // New languages added
    sql: `
-- MySQL Code Stub
-- This stub is for SQL questions, typically running on a MySQL-compatible database.

-- IMPORTANT: For data to persist for subsequent queries within the same run,
-- all CREATE TABLE and INSERT statements must be included in this code block
-- alongside your SELECT or other DML operations. The database state is temporary
-- and resets with each new execution or page refresh.

-- Problem: Create a table named 'STUDENTS' and insert sample data.
-- The table should have columns:
-- empid (INTEGER, Primary Key)
-- stdName (VARCHAR(100), NOT NULL)
-- stdDept (VARCHAR(100), UNIQUE)

-- Create Table Statement:
CREATE TABLE STUDENTS (
    empid INTEGER PRIMARY KEY,
    stdName VARCHAR(100) NOT NULL,
    stdDept VARCHAR(100) UNIQUE
);

-- Insert Sample Data:
INSERT INTO STUDENTS (empid, stdName, stdDept) VALUES (1, 'REDDY', 'ECE');
INSERT INTO STUDENTS (empid, stdName, stdDept) VALUES (2, 'SUMANTH', 'CIVIL');
INSERT INTO STUDENTS (empid, stdName, stdDept) VALUES (3, 'PRATAP', 'MECH');
INSERT INTO STUDENTS (empid, stdName, stdDept) VALUES (4, 'PAVITHRA', 'ECE');
INSERT INTO STUDENTS (empid, stdName, stdDept) VALUES (5, 'DEEPIKA', 'CSE');

-- Your Solution Query (e.g., to fetch data):
SELECT * FROM STUDENTS WHERE stdDept = 'MECH';
`,
    plsql: `
-- PL/SQL Code Stub (Oracle SQL)
-- This stub is for PL/SQL questions, typically running on an Oracle database.

-- Problem: Create a table named 'Employees' and then write a PL/SQL block
-- to insert a new employee and print a confirmation message.
-- The table should have columns:
-- employee_id (NUMBER, Primary Key)
-- employee_name (VARCHAR2(100), NOT NULL)
-- department (VARCHAR2(100))

-- DDL for table creation:
-- (You might need to execute this separately or if the environment allows DDL in PL/SQL block)
CREATE TABLE Employees (
    employee_id NUMBER PRIMARY KEY,
    employee_name VARCHAR2(100) NOT NULL,
    department VARCHAR2(100)
);

-- Example PL/SQL Anonymous Block:
-- Declare variables and write your logic here.
DECLARE
    v_new_employee_id NUMBER := 101;
    v_new_employee_name VARCHAR2(100) := 'Maria Garcia';
    v_new_department VARCHAR2(100) := 'Human Resources';
BEGIN
    -- Insert a new record into the Employees table
    INSERT INTO Employees (employee_id, employee_name, department)
    VALUES (v_new_employee_id, v_new_employee_name, v_new_department);

    -- Commit the transaction (important in PL/SQL)
    COMMIT;

    -- Print a confirmation message
    DBMS_OUTPUT.PUT_LINE('Employee ' || v_new_employee_name || ' inserted successfully!');

EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        DBMS_OUTPUT.PUT_LINE('Error: Employee ID ' || v_new_employee_id || ' already exists.');
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('An unexpected error occurred: ' || SQLERRM);
END;
/

-- To enable DBMS_OUTPUT, you might need to run:
-- SET SERVEROUTPUT ON;
-- before executing the block in some SQL clients.

-- Example of a simple SELECT statement (run outside PL/SQL block):
-- SELECT * FROM Employees;
`,
    
};

const skillsData = {
    'Programming': [
        { value: 'C', text: 'C' },
        { value: 'C++', text: 'C++' },
        { value: 'Java 11', text: 'Java' },
        { value: 'PHP', text: 'PHP' },
        { value: 'Python 3', text: 'Python' },
        { value: 'TypeScript', text: 'TypeScript' },
        { value: 'React JS', text: 'React JS' },
        { value: 'JavaScript', text: 'JavaScript' }
    ],
    'SQL': [
        { value: 'SQL', text: 'SQL' }
    ]
};


// Excel file upload handler for test case input/output
function handleExcelUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    if (!window.XLSX) {
        alert('Excel parsing library not loaded.');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        // Use the first sheet only
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        // Flatten the data into a string (tab-separated columns, newline-separated rows)
        const text = json.map(row => row.join('\t')).join('\n');
        if (type === 'input') {
            document.getElementById('input-data').value = text;
        } else if (type === 'output') {
            document.getElementById('output-data').value = text;
        }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
}

// Dynamically load SheetJS (XLSX) library if not present
(function loadSheetJS() {
    if (!window.XLSX) {
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.onload = function() { /* SheetJS loaded */ };
        document.head.appendChild(script);
    }
})();

function execCmd(command, value = null) {
  document.execCommand(command, false, value);
}

function insertTextAtCursor(text) {
    const editor = document.getElementById('description-editor');
    editor.focus();
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.setStart(range.endContainer, range.endOffset);
    selection.removeAllRanges();
    selection.addRange(range);
}

function insertCodeBlock() {
  const messageBox = document.createElement('div');
  messageBox.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 1000; text-align: center; font-family: 'Inter', sans-serif;
  `;
  messageBox.innerHTML = `
      <p>Enter code block content:</p>
      <textarea id="codeContent" rows="5" cols="40" style="width: 100%; margin-top: 10px; padding: 8px; border: 1px solid #ccc; border-radius: 5px;"></textarea>
      <button id="confirmCodeBtn" style="margin-top: 15px; padding: 8px 15px; background-color: #1d2686; color: white; border: none; border-radius: 5px; cursor: pointer;">Insert</button>
      <button onclick="this.parentNode.remove()" style="margin-top: 15px; margin-left: 10px; padding: 8px 15px; background-color: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
  `;
  document.body.appendChild(messageBox);

  document.getElementById('confirmCodeBtn').onclick = () => {
      const code = document.getElementById('codeContent').value;
      if (code) {
        const pre = document.createElement('pre');
        pre.style.backgroundColor = '#f5f5f5';
        pre.style.padding = '10px';
        pre.style.borderRadius = '5px';
        pre.textContent = code;
        document.getElementById('description-editor').focus();
        document.execCommand('insertHTML', false, pre.outerHTML);
      }
      messageBox.remove();
  };
}

function insertImageFromFile(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            execCmd('insertImage', dataUrl);
        };
        reader.readAsDataURL(file);
    }
    event.target.value = '';
}
function openVideoFileInput() {
    document.getElementById('videoFileInput').click();
}

function clearEditor() {
  const messageBox = document.createElement('div');
  messageBox.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 1000; text-align: center; font-family: 'Inter', sans-serif;
  `;
  messageBox.innerHTML = `
      <p>Are you sure you want to clear all content from the description editor?</p>
      <button id="confirmClearBtn" style="margin-top: 15px; padding: 8px 15px; background-color: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">Yes, Clear</button>
      <button onclick="this.parentNode.remove()" style="margin-top: 15px; margin-left: 10px; padding: 8px 15px; background-color: #ddd; color: #333; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
  `;
  document.body.appendChild(messageBox);

  document.getElementById('confirmClearBtn').onclick = () => {
      document.getElementById('description-editor').innerHTML = '';
      messageBox.remove();
  };
}

function insertTable() {
  const messageBox = document.createElement('div');
  messageBox.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 1000; text-align: center; font-family: 'Inter', sans-serif;
  `;
  messageBox.innerHTML = `
      <p>Enter table dimensions:</p>
      Rows: <input type="number" id="tableRows" value="3" min="1" style="width: 50px; margin: 5px;"/><br>
      Cols: <input type="number" id="tableCols" value="3" min="1" style="width: 50px; margin: 5px;"/><br>
      <button id="confirmTableBtn" style="margin-top: 15px; padding: 8px 15px; background-color: #1d2686; color: white; border: none; border-radius: 5px; cursor: pointer;">Insert</button>
      <button onclick="this.parentNode.remove()" style="margin-top: 15px; margin-left: 10px; padding: 8px 15px; background-color: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
  `;
  document.body.appendChild(messageBox);

  document.getElementById('confirmTableBtn').onclick = () => {
      const rows = parseInt(document.getElementById('tableRows').value);
      const cols = parseInt(document.getElementById('tableCols').value);
      if (rows > 0 && cols > 0) {
        let tableHtml = '<table border="1" style="width:100%; border-collapse: collapse;">';
        for (let i = 0; i < rows; i++) {
          tableHtml += '<tr>';
          for (let j = 0; j < cols; j++) {
            tableHtml += '<td>&nbsp;</td>';
          }
          tableHtml += '</tr>';
        }
        tableHtml += '</table>';
        document.getElementById('description-editor').focus();
        document.execCommand('insertHTML', false, tableHtml);
      }
      messageBox.remove();
  };
}

function openTestCaseModal(editRow = null) {
  document.getElementById('testCaseModal').style.display = 'flex';
  const addBtn = document.getElementById('addTestCaseModalBtn');
  const updateBtn = document.getElementById('updateTestCaseModalBtn');
  const deleteBtn = document.getElementById('deleteTestCaseModalBtn');

  if (editRow) {
    editingTestCaseIndex = editRow.rowIndex - 1;
    const cells = editRow.children;
    document.getElementById('input-data').value = cells[2].querySelector('pre').textContent;
    document.getElementById('output-data').value = cells[3].querySelector('pre').textContent;
    document.getElementById('test-description').value = cells[1].textContent === 'N/A' ? '' : cells[1].textContent;
    document.getElementById('test-categories').value = cells[4].textContent === 'N/A' ? '' : cells[4].textContent;
    // Corrected: Use cells[5] for weightage and ensure it's empty if 'N/A'
    document.getElementById('weightage').value = cells[5].textContent === '' ? '' : cells[5].textContent; // Adjusted to be empty if truly empty
    

    addBtn.style.display = 'none';
    updateBtn.style.display = 'inline-block';
    deleteBtn.style.display = 'inline-block';
    updateBtn.onclick = () => updateTestCaseInTable(editRow);
    deleteBtn.onclick = () => deleteTestCaseFromModal(editRow);
  } else {
    editingTestCaseIndex = -1;
    document.getElementById('input-data').value = '';
    document.getElementById('output-data').value = '';
    document.getElementById('test-description').value = '';
    document.getElementById('test-categories').value = '';
    document.getElementById('weightage').value = '';

    addBtn.style.display = 'inline-block';
    updateBtn.style.display = 'none';
    deleteBtn.style.display = 'none';
    addBtn.onclick = addTestCaseToTable;
  }
}

function closeTestCaseModal() {
  document.getElementById('testCaseModal').style.display = 'none';
  document.getElementById('input-data').value = '';
  document.getElementById('output-data').value = '';
  document.getElementById('test-description').value = '';
  document.getElementById('test-categories').value = '';
  document.getElementById('weightage').value = '';
  editingTestCaseIndex = -1;
}

function handleFileUpload(event, type) {
  const file = event.target.files[0];
  if (file) {
    const allowedTypes = [
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
      showMessageBox('Invalid file type. Please upload a .txt or .doc/.docx file.');
      event.target.value = ''; // Clear the file input
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'input') {
        document.getElementById('input-data').value = e.target.result;
      } else if (type === 'output') {
        document.getElementById('output-data').value = e.target.result;
      }
    };
    reader.readAsText(file);
  }
}

function addTestCaseToTable() {
    const tableBody = document.querySelector('.test-case-table tbody');
    const inputData = document.getElementById('input-data').value;
    const outputData = document.getElementById('output-data').value;
    const description = document.getElementById('test-description').value;
    const categories = document.getElementById('test-categories').value;
    const weightage = document.getElementById('weightage').value;

    if (!inputData.trim() || !outputData.trim()) {
         showMessageBox('Input and Output Data Are Required For A Test Case.');
        return;
    }

    if (weightage !== '' && !/^\d+(\.\d+)?$/.test(weightage)) {
        showMessageBox('Weightage Must Be A Valid Number.');
        return;
    }

    testCaseCounter++;

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${testCaseCounter}</td>
        <td>${description || 'N/A'}</td>
        <td><pre>${escapeHtml(inputData)}</pre></td>
        <td><pre>${escapeHtml(outputData)}</pre></td>
        <td>${categories || 'N/A'}</td>
        <td>${weightage || ''}</td>
        <td>
            <button onclick="editTestCase(this)">Edit</button>
            <button onclick="deleteTestCase(this)">Delete</button>
        </td>
    `;
    tableBody.appendChild(newRow);
    closeTestCaseModal();
    showMessageBox('Test Case Added Successfully.');
    reindexTestCases();
}

function updateTestCaseInTable(rowToUpdate) {
    const inputData = document.getElementById('input-data').value;
    const outputData = document.getElementById('output-data').value;
    const description = document.getElementById('test-description').value;
    const categories = document.getElementById('test-categories').value;
    const weightage = document.getElementById('weightage').value;

    if (!inputData.trim() || !outputData.trim()) {
         showMessageBox('Input and Output data Are Required For A Test Case.');
        return;
    }

    if (weightage !== '' && !/^\d+(\.\d+)?$/.test(weightage)) {
        showMessageBox('Weightage Must Be A Valid Number.');
        return;
    }

    rowToUpdate.children[1].textContent = description || 'N/A';
    rowToUpdate.children[2].querySelector('pre').textContent = inputData;
    rowToUpdate.children[3].querySelector('pre').textContent = outputData;
    rowToUpdate.children[4].textContent = categories || 'N/A';
    rowToUpdate.children[5].textContent = weightage || '';
    
    closeTestCaseModal();
    showMessageBox('Test Case Updated Successfully.');
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function editTestCase(button) {
    const row = button.closest('tr');
    openTestCaseModal(row);
}

function deleteTestCase(button) {
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 1000; text-align: center; font-family: 'Inter', sans-serif;
    `;
    messageBox.innerHTML = `
        <p>Are you sure you want to delete this test case?</p>
        <button id="confirmDeleteBtn" style="margin-top: 15px; padding: 8px 15px; background-color: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">Yes, Delete</button>
        <button onclick="this.parentNode.remove()" style="margin-top: 15px; margin-left: 10px; padding: 8px 15px; background-color: #ddd; color: #333; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
    `;
    document.body.appendChild(messageBox);

    document.getElementById('confirmDeleteBtn').onclick = () => {
        button.closest('tr').remove();
        messageBox.remove();
        reindexTestCases();
        showMessageBox('Test Case Deleted successfully.');
    };
}

function deleteTestCaseFromModal(rowToUpdate) {
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 1000; text-align: center; font-family: 'Inter', sans-serif;
    `;
    messageBox.innerHTML = `
        <p>Are you sure you want to delete this test case?</p>
        <button id="confirmDeleteBtnModal" style="margin-top: 15px; padding: 8px 15px; background-color: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">Yes, Delete</button>
        <button onclick="this.parentNode.remove()" style="margin-top: 15px; margin-left: 10px; padding: 8px 15px; background-color: #ddd; color: #333; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
    `;
    document.body.appendChild(messageBox);

    document.getElementById('confirmDeleteBtnModal').onclick = () => {
        rowToUpdate.remove();
        messageBox.remove();
        closeTestCaseModal();
        reindexTestCases();
        showMessageBox('Test Case Deleted Successfully.');
    };
}

function reindexTestCases() {
    const tableRows = document.querySelectorAll('.test-case-table tbody tr');
    tableRows.forEach((row, index) => {
        row.children[0].textContent = index + 1;
    });
    testCaseCounter = tableRows.length;
}

function checkMandatoryFields(sectionId) {
    let isFilled = true;
    if (sectionId === 'add-question-details') {
        const questionTitle = document.getElementById('questionTitle')?.value.trim();
        const descriptionElem = document.getElementById('description-editor');
        let description = '';
        if (descriptionElem) {
            // Remove whitespace and HTML tags to check if empty
            description = descriptionElem.innerText.replace(/\s+/g, '').replace(/\u200B/g, '');
        }
        const difficulty = document.getElementById('difficultySelect')?.value || '';
        const dok = document.getElementById('dokSelect')?.value || '';
        const points = document.getElementById('pointsInput')?.value || '';
        const domain = document.querySelector('input[name="domain"]:checked')?.value || '';
        const timeToAnswer = document.getElementById('timeToAnswerInput')?.value || '';

        if (!questionTitle) {
            showMessageBox('Please enter the Question Title Before Proceeding.');
            isFilled = false;
        } else if (!description || description === '<br>') {
            showMessageBox('Please Enter The Description Before Proceeding.');
            isFilled = false;
        } else if (!difficulty) {
            showMessageBox('Please Select A Difficulty Level Before Proceeding.');
            isFilled = false;
        } else if (!dok) {
            showMessageBox('Please Select A Depth Of Knowledge Before Proceeding.');
            isFilled = false;
        } else if (!points) {
            showMessageBox('Please Enter Points Before Proceeding.');
            isFilled = false;
        } else if (!domain) {
            showMessageBox('Please Select A Domain Before Proceeding.');
            isFilled = false;
        } else if (!timeToAnswer) {
            showMessageBox('Please Enter Time To Answer Before Proceeding.');
            isFilled = false;
        }
    } else if (sectionId === 'add-test-cases') {
        const autoEvaluateRadio = document.querySelector('input[name="eval"][value="Auto evaluate"]');
        if (autoEvaluateRadio && autoEvaluateRadio.checked) {
            const testCaseRows = document.querySelectorAll('#testCaseTable tbody tr');
            if (testCaseRows.length === 0) {
                showMessageBox('Please Add At Least One Test Case Before Proceeding.');
                isFilled = false;
            }
        }
    }
    return isFilled;
}

function activateSection(targetId) {
    const currentActiveTab = document.querySelector('.step-tab.active');
    let currentActiveSectionId = '';
    if (currentActiveTab) {
        currentActiveSectionId = currentActiveTab.dataset.target;
    }

    const currentTabIndex = Array.from(document.querySelectorAll('.step-tab')).findIndex(tab => tab.dataset.target === currentActiveSectionId);
    const targetTabIndex = Array.from(document.querySelectorAll('.step-tab')).findIndex(tab => tab.dataset.target === targetId);

    // Prevent moving to the same tab
    if (currentTabIndex === targetTabIndex) {
        return;
    }

    // Handle forward navigation (only allow moving to the next sequential tab)
    if (targetTabIndex > currentTabIndex) {
        if (targetTabIndex !== currentTabIndex + 1) {
            // Trying to skip a step
            showMessageBox(' Use The "SAVE & PROCEED" Button To Move To The Next Step.');
            return;
        }

        // Check mandatory fields for the current section before allowing forward movement
        if (!checkMandatoryFields(currentActiveSectionId)) {
            // showMessageBox is called within checkMandatoryFields if a field is missing.
            return;
        }
    }
    // If moving backward (targetTabIndex < currentTabIndex), no validation needed, allow the move.

    // Proceed with activating the section if checks pass
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(targetId).classList.add('active');

    document.querySelectorAll('.step-tab').forEach(tab => tab.classList.remove('active'));
    const correspondingTab = document.querySelector(`.step-tab[data-target="${targetId}"]`);
    if (correspondingTab) {
        correspondingTab.classList.add('active');
    }

    const saveAndProceedBtn = document.getElementById('saveAndProceedBtn');
    if (targetId === 'select-language') {
        saveAndProceedBtn.textContent = 'Save Question';
    } else {
        saveAndProceedBtn.textContent = 'Save & Proceed';
    }

    // Toolbar visibility logic: only show if 'add-question-details' is active
    if (targetId === 'add-question-details') {
        // Only add 'active' if description editor is focused, otherwise keep it hidden initially
        const descriptionEditor = document.getElementById('description-editor');
        if (document.activeElement === descriptionEditor || descriptionEditor.contains(document.activeElement)) {
            document.getElementById('richTextToolbar').classList.add('active');
        } else {
            document.getElementById('richTextToolbar').classList.remove('active');
        }
    } else {
        document.getElementById('richTextToolbar').classList.remove('active');
    }
    updatePreviewButtonState(); // Update preview button visibility
}


function addSelectedTopicFromPage() {
    const assessmentArea = document.getElementById('assessmentAreaSelectPage').value;
    const skill = document.getElementById('skillsSelectPage').value;

    if (assessmentArea && skill) {
        const topic = `${assessmentArea} - ${skill}`;
        if (!selectedTopics.includes(topic)) {
            selectedTopics.push(topic);
            updateTopicsDisplay();
            updateTopicsDisplayPage();
            document.getElementById('assessmentAreaSelectPage').value = '';
            document.getElementById('skillsSelectPage').value = '';
        } else {
             showMessageBox('This Topic Combination Has Already Been Added.');
        }
    } else {
        showMessageBox('Please Select Both An Assessment Area And A Skill.');
    }
}

function removeTopic(index) {
    selectedTopics.splice(index, 1);
    updateTopicsDisplay();
    updateTopicsDisplayPage();
}

function updateTopicsDisplay() {
    const topicsCountSpan = document.getElementById('topicsSelectedCount');
    topicsCountSpan.textContent = `${selectedTopics.length} topics selected`;

    const selectedTopicsDisplayDiv = document.getElementById('selectedTopicsDisplay');
    selectedTopicsDisplayDiv.innerHTML = '';
    selectedTopics.forEach((topic, index) => {
        const topicTag = document.createElement('span');
        topicTag.className = 'topic-tag';
        topicTag.innerHTML = `${topic} <span class="remove-tag" onclick="removeTopic(${index})">&times;</span>`;
        selectedTopicsDisplayDiv.appendChild(topicTag);
    });
}

function updateTopicsDisplayPage() {
    const selectedTopicsDisplayPageDiv = document.getElementById('selectedTopicsDisplayPage');
    selectedTopicsDisplayPageDiv.innerHTML = '';
    selectedTopics.forEach((topic, index) => {
        const topicTag = document.createElement('span');
        topicTag.className = 'topic-tag';
        topicTag.innerHTML = `${topic} <span class="remove-tag" onclick="removeTopic(${index})">&times;</span>`;
        selectedTopicsDisplayPageDiv.appendChild(topicTag);
    });
}

function addFunctionParameter() {
const container = document.getElementById('functionParametersContainer');
const newParamDiv = document.createElement('div');
newParamDiv.className = 'parameter-row';
newParamDiv.innerHTML = `
    <div class="form-group" style="flex: 1;">
        <input type="text" class="function-param-name" placeholder="Parameter Name" style="height:44px;"/>
    </div>
    <div class="form-group" style="flex: 1;">
        <select class="function-param-type" style="height:44px;">
            <option value=>Select Type</option> 
            <option value="int">Integer</option>
            <option value="String">String</option>
            <option value="long">Long Integer</option>
            <option value="float">Float</option>
            <option value="double">Double</option>
            <option value="char">Character</option>
            <option value="boolean">Boolean</option>
            <option value="int[]">Integer Array</option>
            <option value="String[]">String Array</option>
        </select>
    </div>
    <button class="remove-param-btn"
style="background-color:#f44336;height:44px;width:44px;display:flex;align-items:center;justify-content:center;padding:0;margin-left:10px;border-radius:4px;border:1px solid #ccc;"
onclick="removeFunctionParameter(this)">-</button>
`;
container.appendChild(newParamDiv);
}

function removeFunctionParameter(button) {
    button.closest('.parameter-row').remove();
    // No need to hide sections if no parameters left, as per new requirements.
}

function showGenerateCodeConfirm() {
    const currentCode = document.getElementById('demo-code-display').value.trim();
    const defaultPlaceholder = "Select a language to see demo code.".trim();

    if (currentCode !== '' && currentCode !== defaultPlaceholder) {
        const messageBox = document.createElement('div');
        messageBox.className = 'generate-code-confirm-box';
        messageBox.innerHTML = `
            <p>Any Manually Added Code Will Be Replaced.</p>
            <div class="btn-group">
                <button class="confirm-btn" id="confirmGenerateCodeBtn">Generate Code</button>
                <button class="cancel-btn" id="cancelGenerateCodeBtn">Cancel</button>
            </div>
        `;
        document.body.appendChild(messageBox);

        document.getElementById('confirmGenerateCodeBtn').onclick = () => {
            generateCodeStub();
            messageBox.remove();
        };
        document.getElementById('cancelGenerateCodeBtn').onclick = () => {
            messageBox.remove();
        };
    } else {
        generateCodeStub();
    }
}

function updatePreviewButtonState() {
    const activeTabTarget = document.querySelector('.step-tab.active').dataset.target;
    const previewBtn = document.querySelector('.preview-btn');
    if (activeTabTarget === 'select-language') {
        previewBtn.style.display = 'inline-block'; // Show the button
    } else {
        previewBtn.style.display = 'none'; // Hide the button
    }
}
function getLanguageSpecificType(lang, genericType) {
    const type = genericType.toLowerCase();
    switch (lang) {
        case 'java8':
        case 'java11':
        case 'python27':
        case 'python3':
            if (type.includes('[]')) return 'list'; // Python uses list for arrays
            return { 'string': 'str', 'boolean': 'bool', 'int': 'int', 'long': 'int', 'float': 'float', 'double': 'float' }[type] || 'object';
        case 'typescript':
        case 'typescript545':
        case 'cpp':
             if (type === 'string') return 'std::string';
             if (type.includes('[]')) return `std::vector<${getLanguageSpecificType(lang, type.replace('[]',''))}>`;
             return type;
        case 'c':
             if (type.includes('[]')) return `${getLanguageSpecificType(lang, type.replace('[]',''))}*`;
             return type;
        case 'sql':    // SQL/PLSQL do not have function parameters in the same way
            return ''; // Dynamically typed or no explicit type in parameters
        case 'plsql': // PL/SQL uses specific types, map them as needed
            if (type === 'int') return 'NUMBER';
            if (type === 'string') return 'VARCHAR2';
            // Add more PL/SQL type mappings if needed
            return genericType.toUpperCase();
        default:
            return genericType;
    }
}

function generateCodeStub() {
    const functionName = document.getElementById('functionName').value.trim() || 'solution';
    const returnType = document.getElementById('returnType').value;
    const params = Array.from(document.querySelectorAll('#functionParametersContainer .parameter-row')).map(row => {
        const name = row.querySelector('.function-param-name').value.trim();
        const type = row.querySelector('.function-param-type').value;
        return { name, type };
    }).filter(p => p.name);

    codeStubs = {}; // Reset the global stubs

    if (selectedLanguages.length === 0) {
        showMessageBox("Please Select At Least One Language First.");
        // Clear code editor if no languages are selected
        document.getElementById('demo-code-display').value = '';
        populateMainLanguageDropdown(); // Update dropdown to show "No Language Selected"
        return;
    }

    selectedLanguages.forEach(lang => {
        const template = languageTemplates[lang];
        if (!template) {
            codeStubs[lang] = `// Code Stub For ${formatLanguageName(lang)} Is Not Available.`;
            return;
        }

        let langReturnType = getLanguageSpecificType(lang, returnType);

        let langParams;
        let jsdocParams = '';
        let jsdocReturn = '';

        if (lang === 'haskell') {
            const haskellTypes = params.map(p => getLanguageSpecificType(lang, p.type)).join(' -> ');
            langParams = params.map(p => p.name).join(' ');
            langReturnType = langReturnType; // Already handled by getLanguageSpecificType
            langParams = params.map(p => p.name).join(' ');
            codeStubs[lang] = template
                .replace(/{{functionName}}/g, functionName)
                .replace(/{{haskellParams}}/g, haskellTypes || '()') // Adjust if no params
                .replace(/{{returnType}}/g, langReturnType);
        } else {
            langParams = params.map(p => {
                const paramType = getLanguageSpecificType(lang, p.type);
                switch (lang) {
                    case 'python27':
                    case 'python3':
                    case 'ruby':
                    case 'php':
                    case 'r':
                    case 'bash':
                    case 'clojure':
                    case 'sql': // SQL doesn't use function parameters in this context
                        return `${p.name}`; // Dynamically typed or convention without explicit types in stub params
                    case 'javascript':
                    case 'javascript-nodejs2012':
                    case 'reactjs': // React JS params are like JavaScript
                        return p.name;
                    case 'typescript':
                    case 'typescript545':
                        return `${p.name}: ${paramType}`;
                    case 'go':
                        return `${p.name} ${paramType}`;
                    case 'csharp':
                    case 'vbnet':
                        return `${p.name} As ${paramType}`;
                    case 'plsql': // PL/SQL function/procedure parameters
                         // For simplicity in the stub, we'll just list names or an.example.
                         // Actual PL/SQL functions/procedures would need more structured parameter lists (e.g., param_name IN param_type)
                         return `${p.name} IN ${paramType}`; // Example for IN parameter
                    default: // Java, C++, C, Kotlin, Scala, Swift (explicit types)
                        return `${paramType} ${p.name}`;
                }
            }).join(', ');

            // JSDoc for JavaScript/TypeScript/ReactJS
            jsdocParams = params.map(p => `${getLanguageSpecificType('javascript', p.type)} ${p.name}`).join(', ');
            jsdocReturn = getLanguageSpecificType('javascript', returnType);

            let paramCount = params.length;

            const code = template
                .replace(/{{functionName}}/g, functionName)
                .replace(/{{returnType}}/g, langReturnType)
                .replace(/{{parameters}}/g, langParams)
                .replace(/{{jsdocParams}}/g, jsdocParams)
                .replace(/{{jsdocReturn}}/g, jsdocReturn)
                .replace(/{{paramCount}}/g, paramCount); // For Erlang
            codeStubs[lang] = code.trim();
        }
    });

    populateMainLanguageDropdown();
    // Automatically select and display the first language's stub
    if (selectedLanguages.length > 0) {
        const firstLang = selectedLanguages[0];
        document.getElementById('mainLanguageSelect').value = firstLang;
        updateMainCodeEditor(firstLang);
    } else {
        // If no languages are selected, clear the code editor
        document.getElementById('demo-code-display').value = '';
    }
    showMessageBox("Code Stubs Generated Successfully For All Selected Languages.");
}


function toggleReadOnly(button) {
    const editor = document.getElementById('demo-code-display');
    editor.readOnly = !editor.readOnly;
    if (editor.readOnly) {
        button.textContent = 'READ ONLY';
        button.classList.add('edit-mode'); /* Add class for specific styling */
    } else {
        button.textContent = 'EDIT MODE';
        button.classList.remove('edit-mode'); /* Remove class */
    }
}

function clearCodeEditor() {
    const editor = document.getElementById('demo-code-display');
    editor.value = '';
}

function populateMainLanguageDropdown() {
    const dropdown = document.getElementById('mainLanguageSelect');
    dropdown.innerHTML = ''; // Clear existing options
    if (selectedLanguages.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No Language Selected.';
        dropdown.appendChild(option);
        dropdown.disabled = true;
    } else {
        dropdown.disabled = false;
        selectedLanguages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang;
            option.textContent = formatLanguageName(lang);
            dropdown.appendChild(option);
        });
    }
}

function updateMainCodeEditor(selectedLang) {
    const mainCodeEditor = document.getElementById('demo-code-display');
    if (mainCodeEditor) {
        mainCodeEditor.value = codeStubs[selectedLang] || `// Code Stub For ${formatLanguageName(selectedLang)} Is Not Available. Generate It First.`;
    }
}


function openPreviewModal() {
    // Get current active tab
    const activeTabTarget = document.querySelector('.step-tab.active').dataset.target;

    if (activeTabTarget !== 'select-language') {
        showMessageBox('Preview is only available from the "Select Language" tab.');
        return;
    }

    // Add 'modal-open' class to body to hide background elements
    document.body.classList.add('modal-open');

    // Push state for browser back button handling
    history.pushState({ modalOpen: true }, 'Preview Question', '#previewModalOpen');

    let previewHtml = `
        <div style="width:100%; height:100%; position:relative; background-color:#f9fafc; padding:15px; box-sizing:border-box;">
            
            <!-- This div provides the border around the iframe content, preventing overlap -->
            <div style="width:100%; height:100%; border: 1px solid #ddd; box-shadow: 0 0 5px rgba(0,0,0,0.1); display:flex;">
                <iframe src="/interview-preview/" style="width:100%; height:100%; border:none;"></iframe>
            </div>

            <!-- The close button is positioned in the top-right corner of the padded container -->
            <button class="preview-close-x" onclick="closePreviewModalAndGoToSelectLanguage()" style="
                position: absolute;
                top: 5px;
                right: 5px;
                z-index: 1001;
                font-size: 20px;
                color: #fff; /* White X */
                background: #f44336; /* Red background */
                border: 2px solid #fff; /* White border */
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                line-height: 1;
                font-weight: bold;
            ">
                &times;
            </button>
        </div>
    `;
    document.getElementById('preview-content').innerHTML = previewHtml;
    document.getElementById('previewModal').style.display = 'flex';
}


function closePreviewModal() {
    document.getElementById('previewModal').style.display = 'none';
    document.getElementById('preview-content').innerHTML = ''; // Clear content to stop iframe
    document.body.classList.remove('modal-open');

    if (history.state && history.state.modalOpen) {
        history.back();
    }
}

    function closePreviewModalAndGoToSelectLanguage() {
    closePreviewModal();
    activateSection('select-language');
}

// Function to open the Custom Input modal
function openCustomInputModal() {
    document.getElementById('customInputModal').style.display = 'flex';
    document.getElementById('customInputTextarea').value = ''; // Clear previous input
}

// Function to close the Custom Input modal
function closeCustomInputModal() {
    document.getElementById('customInputModal').style.display = 'none';
}

// Function to run code with custom input
function runCustomInput() {
    const customInput = document.getElementById('customInputTextarea').value;
    const previewLanguageSelect = document.getElementById('previewLanguageSelect');
    const selectedLang = previewLanguageSelect ? previewLanguageSelect.value : '';

    if (!selectedLang) {
        showMessageBox('Please Select A Language In The Preview Dropdown First.');
        return;
    }

    const codeToRun = codeStubs[selectedLang] || `// No Code Stub Available For ${formatLanguageName(selectedLang)}. Please generate it in the editor first.`;

    // This function would now need to call the Judge0 API with the custom input.
    // For simplicity, we'll reuse the logic from runAllTestCasesInPreview for a single run.
    runSingleJudge0Test(codeToRun, selectedLang, customInput, "Custom Input");
    closeCustomInputModal();
}

// Replace the runAllTestCasesInPreview function with Judge0 logic
async function runAllTestCasesInPreview() {
const tableBody = document.querySelector('.test-case-table tbody');
const testCaseRows = tableBody.querySelectorAll('tr');

if (testCaseRows.length === 0) {
    showMessageBox('No Test Cases Added. Please Add At Least One Test Case In "Add Test Cases" Tab.');
    return;
}

 const previewCodeEditor = document.getElementById('preview-code-editor');
const previewLanguageSelect = document.getElementById('previewLanguageSelect');
const selectedLang = previewLanguageSelect ? previewLanguageSelect.value : '';
if (previewCodeEditor) {
    previewCodeEditor.value = codeStubs[selectedLang] || document.getElementById('demo-code-display').value || '';
}

if (!selectedLang) {
    showMessageBox('Please Select A Language In The Preview Dropdown First.');
    return;
}

const languageMap = {
"c": 50,
"cpp": 54,
"java8": 62,
"java11": 91,
"typescript": 74,
"typescript_5_4_5": 1009,
"python2": 70,
"python3": 71,
"php": 68,
"sql": 82,
};

const languageId = languageMap[selectedLang] || 71;
const codeToRun = document.getElementById('preview-code-editor') ? document.getElementById('preview-code-editor').value : document.getElementById('demo-code-display').value;

// Prepare all test case requests
const requests = Array.from(testCaseRows).map((row, i) => {
    const input = row.children[2].querySelector('pre').textContent.trim();
    const expectedOutput = row.children[3].querySelector('pre').textContent.trim();

    return fetch("https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
            "x-rapidapi-key": "fc51a80923msh6ca7a38bcad57d1p18b4aajsna897184a2e78"
        },
        body: JSON.stringify({
            language_id: languageId,
            source_code: codeToRun,
            stdin: input
        })
    })
    .then(res => res.json())
  .then(data => {
const normalize = s => (s ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
const output = normalize(data.stdout);
const gotOutput = output ? output : "(no output)";
const pass = gotOutput === normalize(expectedOutput);
return `Test Case #${i + 1}: ${pass ? '✅ Passed' : '❌ Failed'}<br>Expected: ${normalize(expectedOutput)}<br>Got: ${gotOutput}<br><br>`;
})
    .catch(() => `Test Case #${i + 1}: ❌ Failed<br>Error running test case.<br><br>`);
});

// Wait for all test cases to finish
const results = await Promise.all(requests);
showMessageBox(results.join(''));
}


// Improved showMessageBox to remove previous boxes and always work
function showMessageBox(message) {
// Remove any existing message boxes
document.querySelectorAll('.custom-message-box').forEach(box => box.remove());

// Create overlay
const overlay = document.createElement('div');
overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.18);
    z-index: 99998;
`;
overlay.className = 'custom-message-overlay';


// Create a new message box
const box = document.createElement('div');
box.className = 'custom-message-box';
box.style.cssText = `
    position: fixed;
    top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: #fff;
    color: #222;
    border-radius: 12px;
    padding: 32px 32px 24px 32px;
    z-index: 99999;
    min-width: 320px;
    max-width: 90vw;
    font-size: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.18);
    text-align: center;
    border: none;
`;
// Close icon
const closeBtn = document.createElement('span');
closeBtn.innerHTML = '&times;';
closeBtn.style.cssText = `
    position: absolute;
    top: 12px;
    right: 18px;
    font-size: 22px;
    color: #888;
    cursor: pointer;
    font-weight: bold;
    transition: color 0.2s;
`;
closeBtn.onmouseover = () => closeBtn.style.color = '#1d2686';
closeBtn.onmouseout = () => closeBtn.style.color = '#888';
closeBtn.onclick = () => {
    box.remove();
    overlay.remove();
};

// Message content
const msgDiv = document.createElement('div');
msgDiv.style.marginBottom = '18px';
msgDiv.innerHTML = message;

// OK button
const okBtn = document.createElement('button');
okBtn.textContent = 'OK';
okBtn.style.cssText = `
    padding: 8px 28px;
    background: #1d2686;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 15px;
    cursor: pointer;
    margin-top: 8px;
`;
okBtn.onclick = () => {
    box.remove();
    overlay.remove();
};

box.appendChild(closeBtn);
box.appendChild(msgDiv);
box.appendChild(okBtn);

document.body.appendChild(overlay);
document.body.appendChild(box);
}

function formatLanguageName(lang) {
    const names = {
        c: 'C', cpp: 'C++', java8: 'Java 8', java11: 'Java 11', python27: 'Python 2.7', python3: 'Python 3',
        typescript: 'Typescript', typescript545: 'Typescript (5.4.5)',
        sql: 'SQL'
    };
    return names[lang] || lang;
}

function selectAllLanguages() {
    const programmingCheckboxes = document.querySelectorAll('.lang-checkbox[data-type="programming"]');
    programmingCheckboxes.forEach(checkbox => {
        checkbox.checked = true;
        checkbox.disabled = false;
    });

    const sqlCheckbox = document.querySelector('.lang-checkbox[data-type="sql"]');
    if (sqlCheckbox) {
        sqlCheckbox.checked = false;
        sqlCheckbox.disabled = true;
    }
    updateSelectedLanguages();
}

function clearAllLanguages() {
    const checkboxes = document.querySelectorAll('.language-selection-checkboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        checkbox.disabled = false; // Ensure all are re-enabled
    });
    updateSelectedLanguages();
}


function updateSelectedLanguages() {
    const languageCheckboxes = document.querySelectorAll('.language-selection-checkboxes input[type="checkbox"]');
    selectedLanguages = Array.from(languageCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    populateMainLanguageDropdown();
    if (selectedLanguages.length === 0) {
        document.getElementById('demo-code-display').value = 'Select A Language To See Demo Code.';
    } else {
        document.getElementById('mainLanguageSelect').value = selectedLanguages[0];
        updateMainCodeEditor(selectedLanguages[0]);
    }
}


function toggleTestCaseSectionVisibility() {
    const autoEvaluateRadio = document.querySelector('input[name="eval"][value="Auto evaluate"]');
    const testCaseTable = document.getElementById('testCaseTable');
    const addTestCaseMainBtn = document.getElementById('addTestCaseMainBtn');

    if (autoEvaluateRadio && autoEvaluateRadio.checked) {
        if (testCaseTable) testCaseTable.style.display = 'table';
        if (addTestCaseMainBtn) addTestCaseMainBtn.style.display = 'inline-block';
    } else {
        if (testCaseTable) testCaseTable.style.display = 'none';
        if (addTestCaseMainBtn) addTestCaseMainBtn.style.display = 'none';
    }
}

// Function to open the Insert Video modal
function openInsertVideoModal() {
    document.getElementById('insertVideoModal').style.display = 'flex';
    document.getElementById('videoUrlInput').value = ''; // Clear previous input
}

// Function to close the Insert Video modal
function closeInsertVideoModal() {
    document.getElementById('insertVideoModal').style.display = 'none';
}

// Function to insert video from URL into the description editor
function insertVideoFromUrl() {
    const videoUrl = document.getElementById('videoUrlInput').value.trim();
    if (!videoUrl) {
        showMessageBox('Please enter a video URL.');
        return;
    }

    let videoHtml = '';
    const descriptionEditor = document.getElementById('description-editor');

    const youtubeMatch = videoUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/);

    if (youtubeMatch && youtubeMatch[1]) {
        const videoId = youtubeMatch[1];
        videoHtml = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-in-picture" allowfullscreen style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;"></iframe>`;
    } else if (videoUrl.match(/\.(mp4|webm|ogg)$/i)) {
        videoHtml = `<video controls src="${videoUrl}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;"></video>`;
    } else {
        showMessageBox('Invalid Video URL. Please Enter A Valid YouTube Link Or A Direct Link To An MP4/WebM/Ogg File.');
        return;
    }

    if (videoHtml) {
        descriptionEditor.focus();
        document.execCommand('insertHTML', false, videoHtml);
        showMessageBox('Video Inserted Successfully.');
        closeInsertVideoModal();
    }
}

async function openRecordVideoModal() {
    document.getElementById('recordVideoModal').style.display = 'flex';
    document.getElementById('recordVideoMessage').textContent = 'Please Allow Camera And Microphone Access.';

    recordedChunks = [];
    recordedVideoBlob = null;
    document.getElementById('videoPreview').srcObject = null;
    document.getElementById('videoPreview').src = '';
    document.getElementById('stopRecordingBtn').disabled = true;
    document.getElementById('playRecordedBtn').disabled = true;
    document.getElementById('insertRecordedBtn').disabled = true;
    document.getElementById('startRecordingBtn').disabled = false;


    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('videoPreview').srcObject = mediaStream;
        document.getElementById('recordVideoMessage').textContent = 'Ready To Record. Click "Start Recording".';
    } catch (err) {
        console.error('Error accessing media devices: ', err);
        showMessageBox('Could Not Access Camera/Microphone. Please Ensure Permissions Are Granted. Error: ' + err.message);
        closeRecordVideoModal();
    }
}

function closeRecordVideoModal() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    recordedChunks = [];
    recordedVideoBlob = null;
    document.getElementById('videoPreview').srcObject = null;
    document.getElementById('videoPreview').src = '';
    document.getElementById('recordVideoModal').style.display = 'none';
}

function startRecording() {
    if (!mediaStream) {
        showMessageBox('Camera/Microphone Access Not Granted Or Failed. Cannot Start Recording.');
        openRecordVideoModal();
        return;
    }

    recordedChunks = [];
    recordedVideoBlob = null;
    document.getElementById('videoPreview').src = '';

    if (mediaRecorder && mediaRecorder.state === 'recording') {
        showMessageBox('Recording Is Already In Progress.');
        return;
    }

    try {
        mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        mediaRecorder.onstop = () => {
            recordedVideoBlob = new Blob(recordedChunks, { type: 'video/webm' });
            const videoURL = URL.createObjectURL(recordedVideoBlob);
            document.getElementById('videoPreview').srcObject = null;
            document.getElementById('videoPreview').src = videoURL;
            document.getElementById('playRecordedBtn').disabled = false;
            document.getElementById('insertRecordedBtn').disabled = false;
            document.getElementById('recordVideoMessage').textContent = 'Recording Finished. Insert.';
        };
        mediaRecorder.start();
        document.getElementById('recordVideoMessage').textContent = 'Recording.....';
        document.getElementById('startRecordingBtn').disabled = true;
        document.getElementById('stopRecordingBtn').disabled = false;
        document.getElementById('playRecordedBtn').disabled = true;
        document.getElementById('insertRecordedBtn').disabled = true;
    } catch (e) {
        console.error('Error starting MediaRecorder:', e);
        showMessageBox('Failed To Start Recording. Error: ' + e.message);
        document.getElementById('startRecordingBtn').disabled = false;
        document.getElementById('stopRecordingBtn').disabled = true;
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        document.getElementById('stopRecordingBtn').disabled = true;
        document.getElementById('startRecordingBtn').disabled = false;
    } else {
        showMessageBox('No Active Recording To Stop.');
    }
}

function playRecordedVideo() {
    if (recordedVideoBlob) {
        const videoURL = URL.createObjectURL(recordedVideoBlob);
        const videoPreview = document.getElementById('videoPreview');
        videoPreview.srcObject = null;
        videoPreview.src = videoURL;
        videoPreview.load();
        videoPreview.play();
        showMessageBox('Playing Recorded Video.');
    } else {
        showMessageBox('No Video Recorded Yet.');
    }
}

function insertRecordedVideo() {
    if (recordedVideoBlob) {
        const videoURL = URL.createObjectURL(recordedVideoBlob);
        const videoHtml = `<video controls src="${videoURL}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;"></video>`;
        document.getElementById('description-editor').focus();
        document.execCommand('insertHTML', false, videoHtml);

        closeRecordVideoModal();
    } else {
        showMessageBox('No Video Recorded To Insert.');
    }
}

function sendPreviewDataToIframe() {
    const iframe = document.querySelector('#previewModal iframe');
    if (!iframe || !iframe.contentWindow) {
        return;
    }

    const questionTitle = document.getElementById('questionTitle').value;
    const description = document.getElementById('description-editor').innerHTML;
    const isAutoEval = document.querySelector('input[name="eval"][value="Auto evaluate"]').checked;

    const testCases = Array.from(document.querySelectorAll('#testCaseTable tbody tr')).map(row => {
        const cells = row.cells;
        return {
            description: cells[1].textContent,
            input: cells[2].querySelector('pre').textContent,
            output: cells[3].querySelector('pre').textContent,
        };
    });

    const codeStubsForPreview = {};
    selectedLanguages.forEach(lang => {
        codeStubsForPreview[lang] = codeStubs[lang] || `// Code stub for ${formatLanguageName(lang)} not generated.`;
    });


    const previewData = {
        type: 'preview-update',
        questionTitle,
        description,
        selectedLanguages,
        isAutoEval,
        testCases,
        codeStubs: codeStubsForPreview
    };

    iframe.contentWindow.postMessage(previewData, '*');
}

function formatTimeInput(value) {
    // Remove all non-digit characters
    let cleaned = value.replace(/\D/g, '');
    
    // Don't allow more than 6 digits (HHMMSS)
    if (cleaned.length > 6) {
        cleaned = cleaned.substring(0, 6);
    }

    let hh = '', mm = '', ss = '';

    if (cleaned.length > 0) {
        hh = cleaned.substring(0, 2);
        if (parseInt(hh) > 23) hh = '23';
    }
    if (cleaned.length > 2) {
        mm = cleaned.substring(2, 4);
        if (parseInt(mm) > 59) mm = '59';
    }
    if (cleaned.length > 4) {
        ss = cleaned.substring(4, 6);
        if (parseInt(ss) > 59) ss = '59';
    }

    cleaned = hh + mm + ss;

    const parts = [];
    if (cleaned.length > 4) {
        parts.push(cleaned.substring(0, 2));
        parts.push(cleaned.substring(2, 4));
        parts.push(cleaned.substring(4));
    } else if (cleaned.length > 2) {
        parts.push(cleaned.substring(0, 2));
        parts.push(cleaned.substring(2));
    } else if (cleaned.length > 0) {
        parts.push(cleaned);
    }
    
    return parts.join(':');
}

function showConfirmBox(message, onConfirm) {
// Remove any existing message boxes
document.querySelectorAll('.custom-confirm-box').forEach(box => box.remove());
document.querySelectorAll('.custom-message-overlay').forEach(overlay => overlay.remove());


// Create overlay
const overlay = document.createElement('div');
overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.18);
    z-index: 99998;
`;
overlay.className = 'custom-message-overlay';

const box = document.createElement('div');
box.className = 'custom-confirm-box';
box.style.cssText = `
    position: fixed;
    top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: #fff;
    color: #222;
    border-radius: 12px;
    padding: 32px;
    z-index: 99999;
    min-width: 320px;
    max-width: 90vw;
    font-size: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.18);
    text-align: center;
    border: none;
`;

const msgDiv = document.createElement('div');
msgDiv.style.marginBottom = '24px';
msgDiv.innerHTML = message;

const btnGroup = document.createElement('div');
btnGroup.style.display = 'flex';
btnGroup.style.justifyContent = 'center';
btnGroup.style.gap = '15px';

const okBtn = document.createElement('button');
okBtn.textContent = 'OK';
okBtn.style.cssText = `
    padding: 8px 28px;
    background: #1d2686;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 15px;
    cursor: pointer;
`;
okBtn.onclick = () => {
    onConfirm();
    box.remove();
    overlay.remove();
};

const cancelBtn = document.createElement('button');
cancelBtn.textContent = 'Cancel';
cancelBtn.style.cssText = `
    padding: 8px 28px;
    background: #6c757d;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 15px;
    cursor: pointer;
`;
cancelBtn.onclick = () => {
    box.remove();
    overlay.remove();
};

btnGroup.appendChild(okBtn);
btnGroup.appendChild(cancelBtn);

box.appendChild(msgDiv);
box.appendChild(btnGroup);

document.body.appendChild(overlay);
document.body.appendChild(box);
}

function clearQuestionDetails() {
document.getElementById('questionTitle').value = '';
document.getElementById('description-editor').innerHTML = '';
document.getElementById('interview').checked = false;
document.getElementById('watermark').checked = true; // Default is checked
document.getElementById('fullscreen').checked = false;

selectedTopics = [];
updateTopicsDisplay();
updateTopicsDisplayPage();

document.getElementById('difficultySelect').value = '';
document.getElementById('dokSelect').value = '';
document.getElementById('pointsInput').value = '1';
document.getElementById('timeToAnswerInput').value = '';

document.querySelector('input[name="domain"][value="Tech"]').checked = true;

document.getElementById('tagsInput').value = '';
document.getElementById('hintTextarea').value = '';
document.getElementById('instructionsTextarea').value = '';
}

function clearTestCases() {
const tableBody = document.querySelector('#testCaseTable tbody');
if (tableBody) {
    tableBody.innerHTML = '';
}
testCaseCounter = 0;
}

function clearLanguageSelection() {
clearAllLanguages(); 

document.getElementById('functionName').value = '';
document.getElementById('returnType').value = '';

const paramsContainer = document.getElementById('functionParametersContainer');
paramsContainer.innerHTML = '';
addFunctionParameter();

codeStubs = {};
document.getElementById('demo-code-display').value = 'Select A Language To See Demo Code.';
populateMainLanguageDropdown();
}


function handleCancelClick() {
const activeSectionId = document.querySelector('.content-section.active').id;
let clearFunction;

if (activeSectionId === 'add-question-details') {
    clearFunction = clearQuestionDetails;
} else if (activeSectionId === 'add-test-cases') {
    clearFunction = clearTestCases;
} else if (activeSectionId === 'select-language') {
    clearFunction = clearLanguageSelection;
} else {
    return;
}

showConfirmBox('Existing data will be removed', clearFunction);
}

// --- FIX: Updated Language Selection Logic ---
function handleLanguageSelection(event) {
    const clickedCheckbox = event.target;
    if (!clickedCheckbox.classList.contains('lang-checkbox')) return;

    const sqlCheckbox = document.querySelector('.lang-checkbox[data-type="sql"]');
    const programmingCheckboxes = document.querySelectorAll('.lang-checkbox[data-type="programming"]');

    if (clickedCheckbox.dataset.type === 'sql' && clickedCheckbox.checked) {
        // If SQL is checked, uncheck and disable all programming languages
        programmingCheckboxes.forEach(cb => {
            cb.checked = false;
            cb.disabled = true;
        });
    } else if (clickedCheckbox.dataset.type === 'sql' && !clickedCheckbox.checked) {
        // If SQL is unchecked, enable all programming languages
        programmingCheckboxes.forEach(cb => {
            cb.disabled = false;
        });
    } else { // A programming language was clicked
        // Check if any programming language is checked
        const anyProgrammingChecked = Array.from(programmingCheckboxes).some(cb => cb.checked);
        if (anyProgrammingChecked) {
            // If yes, disable SQL
            sqlCheckbox.checked = false;
            sqlCheckbox.disabled = true;
        } else {
            // If no programming languages are checked, enable SQL
            sqlCheckbox.disabled = false;
        }
    }
    updateSelectedLanguages();
}


document.addEventListener('DOMContentLoaded', () => {
  const descriptionEditor = document.getElementById('description-editor');
  const richTextToolbar = document.getElementById('richTextToolbar');

  // --- START: Watermark/Placeholder Logic ---
  const checkPlaceholder = () => {
    // This function checks if the editor is effectively empty and toggles a class.
    // It accounts for invisible <br> tags that browsers might add.
    const editorContent = descriptionEditor.innerHTML.trim();
    if (descriptionEditor.innerText.trim() === '' && (editorContent === '' || editorContent === '<br>')) {
        descriptionEditor.classList.add('is-placeholder-visible');
    } else {
        descriptionEditor.classList.remove('is-placeholder-visible');
    }
  };

  // Check placeholder state on input, focus, blur, and load.
  descriptionEditor.addEventListener('input', checkPlaceholder);
  descriptionEditor.addEventListener('focus', checkPlaceholder);
  descriptionEditor.addEventListener('blur', checkPlaceholder);
  checkPlaceholder(); // Initial check on page load.
  // --- END: Watermark/Placeholder Logic ---

  // Show toolbar when description editor is focused
  descriptionEditor.addEventListener('focus', () => {
    richTextToolbar.classList.add('active');
  });

  // Hide toolbar when description editor loses focus,
  // but only if the focus doesn't move to an element within the toolbar itself.
  descriptionEditor.addEventListener('blur', () => {
    setTimeout(() => {
      if (!richTextToolbar.contains(document.activeElement)) {
        richTextToolbar.classList.remove('active');
      }
    }, 100); // Small delay to allow focus to shift to toolbar buttons
  });

  // Keep toolbar visible if a toolbar button is clicked/focused
  richTextToolbar.addEventListener('focusin', () => {
    richTextToolbar.classList.add('active');
  });

  // Hide toolbar if focus moves out of both editor and toolbar
  richTextToolbar.addEventListener('focusout', () => {
    setTimeout(() => {
      if (!descriptionEditor.contains(document.activeElement) && !richTextToolbar.contains(document.activeElement)) {
        richTextToolbar.classList.remove('active');
      }
    }, 100); // Small delay
  });


  const stepTabs = document.querySelectorAll('.step-tab');
  stepTabs.forEach(tab => {
    tab.addEventListener('click', (event) => {
      activateSection(tab.dataset.target);
    });
  });


  const profileMenuContainer = document.getElementById('profileMenuContainer');
  const profileDropdown = document.getElementById('profileDropdown');
  const helpIcon = document.getElementById('helpIcon');
  profileMenuContainer.addEventListener('click', function(event) {
      if (event.target === helpIcon || helpIcon.contains(event.target)) {
          event.stopPropagation();
          showMessageBox('Help Functionality To Be Implemented.');
      } else {
          event.stopPropagation();
          profileDropdown.classList.toggle('show');
      }
  });
  document.addEventListener('click', function(event) {
      if (!profileMenuContainer.contains(event.target)) {
          profileDropdown.classList.remove('show');
      }
  });

    const languageCheckboxesContainer = document.querySelector('.language-selection-checkboxes');
    languageCheckboxesContainer.addEventListener('change', handleLanguageSelection);


  const languageSearchInput = document.getElementById('languageSearch');
  languageSearchInput.addEventListener('keyup', (event) => {
      const searchTerm = event.target.value.toLowerCase();
      document.querySelectorAll('.language-selection-checkboxes .language-item').forEach(item => {
          const labelText = item.querySelector('label').textContent.toLowerCase();
          if (labelText.includes(searchTerm)) {
              item.style.display = 'flex';
          } else {
              item.style.display = 'none';
          }
      });
  });

    const pointsInput = document.getElementById('pointsInput');
    if (pointsInput) {
        pointsInput.addEventListener('input', () => {
            pointsInput.value = pointsInput.value.replace(/[^0-9]/g, '');
        });
    }

    const interviewCheckbox = document.getElementById('interview');
    const tagsInput = document.getElementById('tagsInput');
    if (interviewCheckbox && tagsInput) {
        interviewCheckbox.addEventListener('change', () => {
            const defaultHint = "interview";
            if (interviewCheckbox.checked) {
                tagsInput.value = defaultHint;
            } else {
                if (tagsInput.value === defaultHint) {
                    tagsInput.value = '';
                }
            }
        });
    }


  const saveAndProceedBtn = document.getElementById('saveAndProceedBtn');
  saveAndProceedBtn.addEventListener('click', function() {
    const currentActiveSection = document.querySelector('.content-section.active');
    let nextSectionId = '';

    if (currentActiveSection.id === 'add-question-details') {
        if (!checkMandatoryFields('add-question-details')) {
            return; 
        }
        nextSectionId = 'add-test-cases';
    } else if (currentActiveSection.id === 'add-test-cases') {
        if (!checkMandatoryFields('add-test-cases')) {
            return;
        }
        nextSectionId = 'select-language';
    } else if (currentActiveSection.id === 'select-language') {
        updateSelectedLanguages();
        
        const questionData = collectQuestionFormData();

        if (!questionData.selected_languages || questionData.selected_languages.length === 0) {
            showMessageBox('Please select at least one allowed language before saving.');
            return; 
        }

        if (!questionData.title) {
            showMessageBox("Cannot save. Please go back and add a question title.");
            return;
        }

        // Send data to the Django backend
        fetch('/manual/', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(questionData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showMessageBox(data.message || 'Question Saved Successfully!');
                setTimeout(() => {
                    if (data.redirect_url) {
                        window.location.href = data.redirect_url;
                    } else {
                        window.location.href = '/library/';
                    }
                }, 1500);
            } else {
                showMessageBox('Error saving question: ' + data.message);
                console.error("Error from server:", data.message);
            }
        })
        .catch(error => {
            showMessageBox('An unexpected network error occurred. Please try again.');
            console.error("Fetch error:", error);
        });
        return; 
    }

    if (nextSectionId) {
      activateSection(nextSectionId);
    }
  });

  function collectQuestionFormData() {
    const title = document.getElementById('questionTitle').value;
    const description = document.getElementById('description-editor').innerHTML;
    const difficulty = document.getElementById('difficultySelect').value;
    const depth_of_knowledge = document.getElementById('dokSelect').value;
    const points = parseInt(document.getElementById('pointsInput').value) || 1;
    const time_to_answer = document.getElementById('timeToAnswerInput').value;
    const domain = document.querySelector('input[name="domain"]:checked').value;
    const tags = document.getElementById('tagsInput').value;
    const hint = document.getElementById('hintTextarea').value;
    const instructions = document.getElementById('instructionsTextarea').value;
    const available_in_interview = document.getElementById('interview').checked;
    const enable_watermark = document.getElementById('watermark').checked;
    const deliver_fullscreen = document.getElementById('fullscreen').checked;
    // --- FIX: Removed 'window.' prefix to correctly access script-level variables ---
    const selected_topics = selectedTopics || [];
    const selected_languages = selectedLanguages || [];

    const testCases = [];
    const testCaseTable = document.getElementById('testCaseTable').getElementsByTagName('tbody')[0];
    for (let row of testCaseTable.rows) {
      const cells = row.cells;
      testCases.push({
        description: cells[1]?.innerText || '',
        input_data: cells[2]?.querySelector('pre')?.textContent || '',
        output_data: cells[3]?.querySelector('pre')?.textContent || '',
        categories: cells[4]?.innerText || '',
        weightage: parseFloat(cells[5]?.innerText) || null,
      });
    }

    return {
      title,
      description,
      difficulty,
      depth_of_knowledge,
      points,
      time_to_answer,
      domain,
      tags,
      hint,
      instructions,
      available_in_interview,
      enable_watermark,
      deliver_fullscreen,
      selected_topics,
      test_cases: testCases,
      selected_languages: selected_languages,
    };
  }

  const evaluationModeRadios = document.querySelectorAll('input[name="eval"]');

  toggleTestCaseSectionVisibility();

  evaluationModeRadios.forEach(radio => {
      radio.addEventListener('change', toggleTestCaseSectionVisibility);
  });

  evaluationModeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        if (this.value === "Auto evaluate" && this.checked) {
            localStorage.setItem('auto_evaluation', 'true');
        } else if (this.value === "Manual evaluation" && this.checked) {
            localStorage.setItem('auto_evaluation', 'false');
        }
    });
  });
  const autoEvalRadio = document.querySelector('input[name="eval"][value="Auto evaluate"]');
  if (autoEvalRadio && autoEvalRadio.checked) {
    localStorage.setItem('auto_evaluation', 'true');
  } else {
    localStorage.setItem('auto_evaluation', 'false');
  }


  updateTopicsDisplay();
  updateTopicsDisplayPage();

    const assessmentAreaSelect = document.getElementById('assessmentAreaSelectPage');
    const skillsSelect = document.getElementById('skillsSelectPage');

    assessmentAreaSelect.addEventListener('change', () => {
        const selectedArea = assessmentAreaSelect.value;
        skillsSelect.innerHTML = ''; // Clear current options

        if (selectedArea && skillsData[selectedArea]) {
            skillsData[selectedArea].forEach(skill => {
                const option = document.createElement('option');
                option.value = skill.value;
                option.textContent = skill.text;
                skillsSelect.appendChild(option);
            });
        } else {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select an Assessment Area First';
            skillsSelect.appendChild(defaultOption);
        }
    });


  const addSelectedTopicButton = document.getElementById('addSelectedTopicBtn');
    if (addSelectedTopicButton) {
        addSelectedTopicButton.addEventListener('click', addSelectedTopicFromPage);
    }

  addFunctionParameter();
});

