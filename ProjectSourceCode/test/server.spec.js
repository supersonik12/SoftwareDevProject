// ********************** Initialize server **********************************

const server = require('../src/index.js'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
	// Sample test case given to test / endpoint.
	it('Returns the default welcome message', done => {
		chai
			.request(server)
			.get('/welcome')
			.end((err, res) => {
				expect(res).to.have.status(200);
				expect(res.body.status).to.equals('success');
				assert.strictEqual(res.body.message, 'Welcome!');
				done();
			});
	});
});

describe('Test GET method for login page', () =>
	it('Redirects to login page', done => {
		chai
			.request(server)
			.get('/login')
			.end((err, res) => {
				expect(res).to.have.status(302);
				done();
			});
	}));

describe('Test POST method for successful sign in', () =>
	it('Redirects to home page', done => {
		chai
			.request(server)
			.get('/login')
			.send({ email: 'test@example.com', password: 'testpassword' })
			.end((err, res) => {
				expect(res.body.message.to.equals('Success'));
			});
		done();
	})
);

describe('Test POST method for failed sign in', () =>
	it('Displays an error message to user', done => {
		chai
			.request(server)
			.get('/login')
			.send({ email: 'invalid@example.com', password: 'invalidpassword' })
			.end((err, res) => {
				expect(res.body.message.to.equals('Invalid username or password'));
			});
		done();
	})
);


describe('Test POST method for successful register', () =>
	it('Redirects to the quiz', done => {
		chai
			.request(server)
			.get('/request')
			.send({ email: 'newuser@example.com', password: 'abc123', name: 'John Doe' })
			.end((err, res) => {
				expect(res.body.message.to.equals('Success'));
			});
		done();
	})
);

describe('Test POST method for unsuccessful register', () =>
	it('Displays an error', done => {
		chai
			.request(server)
			.get('/request')
			.send({ email: 123, password: 'abc123', name: 'John Doe' })
			.end((end, res) => {
				expect(res.body.message.equals('Not a valid email'));
			});
		done();
	})
);
// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

describe('GET /purrsonality-quiz', () => {
	it('Renders quiz page', (done) => {
		chai
			.request(app)
			.get('/purrsonality-quiz')
			.end((err, res) => {
				expect(res).to.have.status(200);
				done();
			});
	});
});

describe('POST /purrsonality-quiz', () => {
	it('Test valid input (redirects to home page)', (done) => {
		chai
			.request(app)
			.post('/purrsonality-quiz')
			.send({
				species: 'dog',
				aff_val: 0.5,
				open_val: 0.3,
				play_val: 0.7,
				vigilant_val: 0.2,
				train_val: 0.8,
				energy_val: 0.6,
				bored_val: 0.4,
			})
			.end((err, res) => {
				expect(res).to.redirect;
				done();
			});
	});

	it('Test invalid input', (done) => {
		chai
			.request(app)
			.post('/purrsonality-quiz')
			.send({
				species: 'dog',
				aff_val: 2,
				open_val: 0.5,
				play_val: 0.5,
				vigilant_val: 0.5,
				train_val: 0.5,
				energy_val: 0.5,
				bored_val: 0.5,
			})
			.end((err, res) => {
				expect(res).to.have.status(423);
				expect(res.body).to.have.property('error', 'Values outside expected range');
				done();
			});
	});
});
// ********************************************************************************
