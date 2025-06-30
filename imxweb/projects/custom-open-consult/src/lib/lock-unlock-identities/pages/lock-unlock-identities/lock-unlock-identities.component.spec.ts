import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LockUnlockIdentitiesComponent } from './lock-unlock-identities.component';

describe('LockUnlockIdentitiesComponent', () => {
  let component: LockUnlockIdentitiesComponent;
  let fixture: ComponentFixture<LockUnlockIdentitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LockUnlockIdentitiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LockUnlockIdentitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
