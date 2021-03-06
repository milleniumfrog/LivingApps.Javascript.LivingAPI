import { LivingSDK, LivingSDKOptions, Auth_Token } from './livingsdk';
import { expect } from 'chai';
import {livingappsData as lsd, removeData } from './config'
import { AxiosError } from 'axios';

let SERVER = lsd.url;


enum lsdktemplates {
	default= 'default',
	loggedIn = 'loggedInUsers',
	admin = 'withAdminPrivileges',
	permissions = 'withPermissions',
	workpriv = 'withWorkingPrivileges'
}

type LAAPI = any;

// not logged in user
function createMinLSDK () {
	return new LivingSDK({loginRequired: false, url: SERVER});
}
// logged in user
function createMaxLSDK () {
	return new LivingSDK({url: SERVER}, lsd.username, lsd.password);
}

describe('LivingSDK: ', () => {
	beforeEach( () => {
		// time out for not ddos server
		return new Promise<void>( (resolve, reject ) => {
			setTimeout( () => {
				resolve();
			}, 1000);
		})
	} );
	/*
	 * test login
	 * - getAuthToken
	 */
	describe('.login()', () => {

		it('no login', () => {
			let lsdk = new LivingSDK({loginRequired: false, url: SERVER});
			return lsdk.login().then((auth_token: Auth_Token) => {
				// expect(typeof auth_token).to.equal('undefined');
				console.log( auth_token );
			});
		}).timeout( 10000 );

		it('login with correct username and password', () => {
			let lsdk = new LivingSDK({ url: SERVER}, lsd.username, lsd.password);
			return lsdk.login().then((auth_token: Auth_Token) => {
				console.log(auth_token);
				expect(typeof auth_token).to.equal('string');
			});
		}).timeout( 10000 );

		it('change auth_token', () => {
			let lsdk = new LivingSDK({ url: SERVER}, lsd.username, lsd.password);
			return lsdk.login().then(() => {
				// session is private -> cast lsdk to any
				(<any>lsdk).session = Promise.resolve("10");
				return (<any>lsdk).session;
			}).then(() => {
				return lsdk.get(lsd.appId, lsdktemplates.loggedIn);
			})
			.then(() => {
				throw new Error("user still logged in");
			}).catch((err: any) => {
				expect(err.message).to.equal("Request failed with status code 403");
			});
		}).timeout( 10000 );

		it('login with wrong data', () => {
			let lsdk = new LivingSDK({ url: SERVER}, "foo", "bar");
			return lsdk.login().then((auth_token: Auth_Token) => {
				// teste ob ergebnis leer ist
				expect(auth_token).to.equal(undefined);
			});
		}).timeout( 10000 );
	});


	describe('.get()', () => {

		describe('permissions without login', () => {

			it('request default', () => {
				return createMinLSDK().get(lsd.appId);
			}).timeout( 10000 );

			it('request loggedInUsers', () => {
				return createMinLSDK().get(lsd.appId, lsdktemplates.loggedIn)
					.then(() => {
						throw new Error('should not reach this part of code');
					})
					.catch((err: any) => {
						expect(err.message).to.equal('Request failed with status code 403');
					})
			}).timeout( 10000 );

			it('request withPermissionsForApp', () => {
				return createMinLSDK().get(lsd.appId, lsdktemplates.permissions)
					.then(() => {
						throw new Error('should not reach this part of code');
					})
					.catch((err: any) => {
						expect(err.message).to.equal('Request failed with status code 403');
					})
			}).timeout( 10000 );

			it('request withWorkingPrivilegesApp', () => {
				return createMinLSDK().get(lsd.appId, lsdktemplates.workpriv)
					.then(() => {
						throw new Error('should not reach this part of code');
					})
					.catch((err: any) => {
						expect(err.message).to.equal('Request failed with status code 403');
					})
			}).timeout( 10000 );

			it('request withAdminPrivileges', () => {
				return createMinLSDK().get(lsd.appId, lsdktemplates.admin)
					.then(() => {
						throw new Error('should not reach this part of code');
					})
					.catch((err: any) => {
						expect(err.message).to.equal('Request failed with status code 403');
					})
			}).timeout( 10000 )

		});

		describe('permissions with admin login', () => {

			it('request default', () => {
				return createMaxLSDK().get(lsd.appId);
			}).timeout( 10000 );

			it('request loggedInUsers', () => {
				return createMaxLSDK().get(lsd.appId, lsdktemplates.loggedIn);
			}).timeout( 10000 );

			it('request withPermissionsForApp', () => {
				return createMaxLSDK().get(lsd.appId, lsdktemplates.permissions);
			}).timeout( 10000 );

			it('request withWorkingPrivilegesApp', () => {
				return createMaxLSDK().get(lsd.appId, lsdktemplates.workpriv);
			}).timeout( 10000 );

			it('request withAdminPrivileges', () => {
				return createMaxLSDK().get(lsd.appId, lsdktemplates.admin);
			}).timeout( 10000 );

		});

		it('request not existing app', () => {
			return createMaxLSDK().get('template-unknown-test')
				.then(() => {
					throw new Error('should not reach this part of code');
				})
				.catch((err: any) => {
					expect(err.message).to.equal('Request failed with status code 404');
				})
		}).timeout( 10000 );

	});

	describe('._insert()', () => {

		it('insert in unknown Datasource', () => {
			return createMaxLSDK().get(lsd.appId, lsdktemplates.admin)
				.then((LAAPI: LAAPI) => {
					return LAAPI.get('datasources').get('unknown');
				})
				.then((storage: any) => {
					expect(storage).to.equal(undefined);
				});
		}).timeout( 10000 );

		it('insert an ID to StorageApp', () => {
			return createMaxLSDK().get(lsd.appId, lsdktemplates.admin)
				.then((LAAPI: LAAPI) => {
					return LAAPI.get('datasources').get('storage');
				})
				.then((storage: any) => {
					return storage.app.insert({id: `[JS]${(new Date()).toDateString()}`});
				});
		}).timeout( 10000 );

		it('insert to self', () => {
			return createMaxLSDK().get(lsd.appId, lsdktemplates.admin)
				.then((LAAPI: LAAPI) => {
					return LAAPI.get('datasources').get('self');
				})
				.then((storage: any) => {
					// ignore file upload
					return storage.app.insert({
						text: '[JS] this is a text',
						number: 42,
						phone: '+49 0000 0000000000',
						url: 'https://milleniumfrog.de',
						mail: 'web@example.com',
						date: new Date(),
						textarea: '[JS] this is even more text',
						selection: 'option_1',
						options: '_1',
						multiple_options: ['_1'],
						checkmark: true,
						geodata: '0.0,0.0,'
					});
				});
		}).timeout( 10000 );

		it('auto relog login', () => {
			let lsdk = createMaxLSDK();
			return lsdk.get(lsd.appId, lsdktemplates.admin)
				.then((LAAPI: LAAPI) => {
					(<any>lsdk).session = Promise.resolve('undefined');
					return LAAPI.get('datasources').get('storage');
				})
				.then((storage: any) => {
					return storage.app.insert({id: '[JS] before relogged'})
						.then(() => {
							return storage;
						})
						.catch((err: AxiosError) => {
							if (err.response.status === 403) {
								(<any>lsdk).session = lsdk.login();
								return storage;
							} else {
								return storage;
							}
						})
				})
				.then((storage) => {
					return storage.app.insert({id: '[JS] relogged'})
				});
		}).timeout( 10000 );

	});

	describe('._update()', () => {

		it('update in storage', () => {
			return createMaxLSDK().get(lsd.appId, lsdktemplates.admin)
				.then((LAAPI: LAAPI) => {
					return LAAPI.get('datasources').get('storage').app;
				})
				.then((storage: any) => {
					return storage.records.values();
				})
				.then((records: any) => {
					for (let i of records) {
						return i.update({id: '[JS] updated'});
					}
				});
		}).timeout(5000);

		it('update in self', () => {
			return createMaxLSDK().get(lsd.appId, lsdktemplates.admin)
			.then((LAAPI: LAAPI) => {
				return LAAPI.get('datasources').get('self').app;
			})
			.then((storage: any) => {
				return storage.records.values();
			})
			.then((records: any) => {
				for (let i of records) {
					return i.update({
						text: '[JS] this is a updated text',
						number: 84,
						phone: '+49 0000 0000000001',
						url: 'https://dev.milleniumfrog.de',
						mail: 'update@example.com',
						date: new Date(),
						textarea: '[JS] this is an even more updated text',
						selection: 'option_2',
						options: '_3',
						multiple_options: ['_2'],
						checkmark: true,
						geodata: '0.1,1.0,'
					});
				}
			});
		}).timeout( 10000 )
		it('auto relog update', () => {
			let lsdk = createMaxLSDK();
			return lsdk.get(lsd.appId, lsdktemplates.admin)
			.then((LAAPI: LAAPI) => {
				return LAAPI.get('datasources').get('storage').app;
			})
			.then((storage: any) => {
				(<any>lsdk).session = Promise.resolve('undefined');
				return storage.records.values();
			})
			.then((records: any) => {
				for (let i of records) {
					return i.update({id: '[JS] updated'}).catch((err: AxiosError) => {
						if (err.response.status === 403) {
							(<any>lsdk).session = lsdk.login();
							return i;
						}
						throw err;
					});
				}
			})
			.then((record: any) => {
				return record.update({id: '[JS] updated after relog'});
			});
		}).timeout(5000);

	});

	if (removeData) {
		describe('._delete()', () => {

			it('remove all records from storage', () => {
				return createMaxLSDK().get(lsd.appId, lsdktemplates.admin)
				.then((LAAPI: LAAPI) => {
					return LAAPI.get('datasources').get('storage').app;
				})
				.then((storage: any) => {
					return storage.records.values();
				})
				.then((records: any) => {
					let arr: Array<Promise<any>> = []
					for (let i of records) {
						arr.push(i.delete());
					}
					return Promise.all(arr);
				});
			}).timeout(10000);

			it('remove all records from self', () => {
				return createMaxLSDK().get(lsd.appId, lsdktemplates.admin)
				.then((LAAPI: LAAPI) => {
					return LAAPI.get('datasources').get('self').app;
				})
				.then((storage: any) => {
					return storage.records.values();
				})
				.then((records: any) => {
					let arr: Array<Promise<any>> = []
					for (let i of records) {
						arr.push(i.delete());
					}
					return Promise.all(arr);
				});
			}).timeout(10000);

		});
	}
});