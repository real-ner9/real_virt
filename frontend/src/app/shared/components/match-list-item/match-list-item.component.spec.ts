import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchListItemComponent } from './match-list-item.component';

describe('ListItemComponent', () => {
  let component: MatchListItemComponent;
  let fixture: ComponentFixture<MatchListItemComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MatchListItemComponent]
    });
    fixture = TestBed.createComponent(MatchListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
